// using Express
const fs = require('fs');
const path = require('path');
const { renderToNodeStream } = require('react-dom/server');

module.exports = (templateFile = './view/index.html', options) => {
  const template = fs.readFileSync(
    path.resolve(__dirname, templateFile),
    'utf8'
  );

  const parts = template.split('%body-content%');
  const makeHead = (title = options.title) => `
<title>${title}</title>
`;

  return (req, res, ReactElement, { title } = {}) => {
    res.write(parts[0].replace('%head%', makeHead(title)));
    const stream = renderToNodeStream(ReactElement);
    stream.pipe(res, { end: false });
    stream.on('end', () => {
      res.write(parts[1]);
      res.end();
    });
  };
};
