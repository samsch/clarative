const express = require('express');

const defaultFields = [
  {
    type: 'user',
  },
  {
    name: 'data',
    type: 'string',
  },
];

module.exports = (knex, authenticatedMiddleware, route, data = {}) => {
  const router = express.Router();

  const getAllHandler = (req, res) => {
    const page = (req.query.page || 1) - 1;
    const size = req.query.page || 10;
    const order = req.query.order || 'created_at';
    const direction =
      req.query.direction || order === 'created_at' ? 'desc' : 'asc';
    knex(data.table || route.data)
      .modify(builder => {
        if (!perm.read) {
          builder.where({ userId: req.user.id });
        }
      })
      .orderBy(order, direction)
      .limit(size)
      .offset(page * size)
      .then(items => {
        res.json({
          [route.data]: items,
        });
      });
  };

  const getOneHandler = (req, res) => {
    const id = +req.params.id;
    knex(data.table || route.data)
      .where({ [data.idField || 'id']: id })
      .then(items => {
        // PERMISSIONS This is a very basic check for ownership
        if (
          items.length === 0 ||
          (!perm.read && items[0].userId !== req.user.id)
        ) {
          res.status(404).json({
            error: 'Item not found',
          });
        } else if (items.length !== 1) {
          res.status(500).json({
            error: `Found more than one item with "unique" ID ${id}!`,
          });
        } else {
          res.json({
            [route.data]: items[0],
          });
        }
      });
  };

  const postHandler = (req, res) => {
    const raw = req.body.post;
    let errors = [];
    const newItem = (data.fields || defaultFields).reduce((newItem, field) => {
      switch (field.type) {
        case 'user':
          newItem.userId = req.user.id;
          return newItem;
        case 'string':
          if (raw[field.name] == null) {
            errors.push('required:' + field.name);
            break;
          }
          if (typeof raw[field.name] !== 'string') {
            errors.push('wrong-type:string:' + field.name);
            break;
          }
          break;
        case 'number':
          if (raw[field.name] == null) {
            errors.push('required:' + field.name);
          } else if (typeof raw[field.name] !== 'number') {
            errors.push('wrong-type:number:' + field.name);
          }
          break;
        case 'json':
          if (raw[field.name] == null) {
            errors.push('required:' + field.name);
          } else if (typeof raw[field.name] !== 'string') {
            errors.push('wrong-type:number:' + field.name);
          } else {
            try {
              JSON.parse(raw[field.name]);
            } catch (e) {
              errors.push('invalid-json:' + field.name);
            }
          }
          break;
      }
      newItem[field.name] = raw[field.name];
      return newItem;
    }, {});
    if (errors.length > 0) {
      res.status(400).json({
        errors,
      });
      return;
    }
    knex(data.table || route.data)
      .insert(newItem)
      .returning('id')
      .then(ids => {
        res.json({
          id: ids[0],
        });
      })
      .catch(() => {
        // FEATURE catch a unique error for items with unique fields
        res.status(500).json({
          error: 'Failed to insert item',
        });
      });
  };

  const deleteHandler = (req, res) => {
    const id = +req.params.id;
    knex(data.table || route.data)
      .modify(builder => {
        if (!perm.write) {
          builder
            .where({ userId: req.user.id })
            .andWhere({ [data.idField || 'id']: id });
        } else {
          builder.where({ [data.idField || 'id']: id });
        }
      })
      .delete()
      .then(rowsAffected => {
        if (rowsAffected === 0) {
          res.status(404).json({
            error: 'Item not found',
          });
        } else if (rowsAffected !== 1) {
          res.status(500).json({
            error: `Found more than one item with "unique" ID ${id}!`,
          });
        } else {
          res.json({
            message: 'Item deleted',
          });
        }
      });
  };

  // Possible values for route.login are `undefined`, `true`, `null`, `false`, "read", "write", "all".
  // `null`, `true` and "all" are equivalent: Permissions required for all actions
  // `undefined` and `false` are equivalent: Permissions not required for any actions
  const perm = {
    read: [undefined, false, 'write'].includes(route.login),
    write: [undefined, false, 'read'].includes(route.login),
  };

  if (!perm.read && perm.write) {
    router.get(route.path, authenticatedMiddleware, getAllHandler);
    router.get(route.path + '/:id', authenticatedMiddleware, getOneHandler);
    router.post(route.path, postHandler);
    router.delete(route.path + '/:id', deleteHandler);
  } else if (!perm.write && perm.read) {
    router.get(route.path, getAllHandler);
    router.get(route.path + '/:id', getOneHandler);
    router.post(route.path, authenticatedMiddleware, postHandler);
    router.delete(route.path + '/:id', authenticatedMiddleware, deleteHandler);
  } else {
    if (!perm.read && !perm.write) {
      router.use(authenticatedMiddleware);
    }
    router.get(route.path, getAllHandler);
    router.get(route.path + '/:id', getOneHandler);
    router.post(route.path, postHandler);
    router.delete(route.path + '/:id', deleteHandler);
  }

  return router;
};
