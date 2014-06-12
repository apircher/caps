/*global define*/

/**
 * Caps 1.0 Copyright (c) Pircher Software. All Rights Reserved.
 * Available via the MIT license.
 */

/**
 * Parses user search input and returns a breeze predicate
 * representing that search input.
 */
define([
    'breeze',
    './searchGrammer'
],
function (breeze, grammer) {
    'use strict';

    /**
     * UserQueryParser
     */
    function UserQueryParser() {

    }

    UserQueryParser.prototype.translateColumnName = function (columnName) {
        // Inherited classes can override this function to
        // convert human readable column names like 'Author' to 
        // actual column names like 'Created.By'.
        return columnName;
    };

    UserQueryParser.prototype.getBreezePredicate = function (searchWords) {
        if (searchWords && searchWords.length) {
            var q = parseUserQuery(searchWords);
            if (q) return createBreezePredicate(q, this);
        }
        return null;
    };

    UserQueryParser.prototype.validate = function (searchWords) {
        return parseUserQuery(searchWords) !== null;
    };


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

    function createBreezePredicate(query, parser) {
        if (!query.nodes.length) return null;
        var pred;
        for (var i = 0; i < query.nodes.length; i++) {
            var expr = query.nodes[i];
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
                case 'SearchTerm': return new breeze.Predicate(parser.translateColumnName(n.col), 'contains', n.value);
            }
            return null;
        }
    }    

    return UserQueryParser;
});