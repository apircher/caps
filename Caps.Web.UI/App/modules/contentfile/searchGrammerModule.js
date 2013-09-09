define(['breeze', './searchGrammer'], function (breeze, grammer) {

    grammer.yy = {
        AndExpression: AndExpression,
        OrExpression: OrExpression,
        Query: Query,
        SearchTerm: SearchTerm
    };

    function AndExpression(child) {
        this.child = child;
        this.type = 'AndExpression';
    }

    function OrExpression(child) {
        this.child = child;
        this.type = 'OrExpression';
    }

    function Query(firstNode) {
        this.nodes = [];
        this.nodes.push(firstNode);
        this.type = 'Query';
    }

    Query.prototype.getPredicates = function() {
        if (!this.nodes.length)
            return null;
        var pred;
        for (var i = 0; i < this.nodes.length; i++) {
            var expr = this.nodes[i];
            var cp = NodeToPredicate(expr.child);
            switch (expr.type) {
                case 'AndExpression':
                    pred = pred ? pred.and(cp) : cp;
                    break;
                case 'OrExpression':
                    pred = pred ? pred.or(cp) : cp;
                    break;
            }
        }
        return pred;

        function NodeToPredicate(n) {
            switch (n.type) {
                case 'Query': return n.getPredicates();
                case 'SearchTerm': return new breeze.Predicate(translateColumnName(n.col), 'contains', n.value);
            }
            return null;
        }
    }

    function SearchTerm(value, col) {
        this.value = value;
        this.type = 'SearchTerm';
        this.col = col;
    }


    function parseUserQuery(searchWords) {
        try {
            return grammer.parse(searchWords);
        }
        catch (err) {
            console.log('validateUserQuery failed. ' + err.message);
            return null;
        }
    }

    function isValidUserQuery(searchWords) {
        return parseUserQuery(searchWords) != null;
    }

    function translateColumnName(col) {
        if (col && col.length) {
            if (/autor/i.test(col)) return 'Created.By';
        }
        return 'FileName';
    }

    return {
        parseUserQuery: parseUserQuery,
        isValidUserQuery: isValidUserQuery
    };

});