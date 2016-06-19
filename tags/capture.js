var Liquid = require('..');
var lexical = Liquid.lexical;
var re = new RegExp(`(${lexical.identifier.source})`);

module.exports = function(liquid) {

    liquid.registerTag('capture', {
        parse: function(tagToken, remainTokens) {
            var match = tagToken.args.match(re);
            if (!match) throw new Error(`${tagToken.args} not valid identifier`);

            this.variable = match[1];
            this.templates = [];

            var stream = liquid.parser.parseStream(remainTokens);
            stream.on('tag:endcapture', token => stream.stop())
                .on('template', tpl => this.templates.push(tpl))
                .on('end', x => {
                    throw new Error(`tag ${tagToken.raw} not closed`);
                });
            stream.start();
        },
        render: function(scope, hash) {
            var html = liquid.renderer.renderTemplates(this.templates, scope);
            scope.set(this.variable, html);
        }
    });

};
