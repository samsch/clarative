// @flow
module.exports = (
  options: { user: { publicFields: Array<string> } },
  user: Object
) => {
  return options.user.publicFields.reduce((publicUser, field) => {
    publicUser[field] = user[field];
    return publicUser;
  }, {});
};
