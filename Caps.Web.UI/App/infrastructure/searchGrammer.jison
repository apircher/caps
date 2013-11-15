/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
(UND|und|and|AND|\+)  return 'AND'
(ODER|oder|or|OR|\|)  return 'OR'
\w+                   return 'SEARCHTERM'
"("                   return '('
")"                   return ')'
":"					  return ':'
<<EOF>>               return 'EOF'

/lex

/* operator associations and precedence */

%left 'AND' 'OR'

%start expressions

%% /* language grammar */

expressions
    : QRY EOF 
        {return $1;}
    ;

QRY 
    : EXPR 
        {$$ = new yy.Query($1);}
    | QRY EXPR 
        {$1.nodes.push($2);}
    ;

EXPR
    : T 
        {$$ = new yy.AndExpression($1);}
    | AND T
        {$$ = new yy.AndExpression($2);}
    | OR T
        {$$ = new yy.OrExpression($2);}    
    ;

T   : SEARCHTERM
        {$$ = new yy.SearchTerm($1);}
	| SEARCHTERM ':' SEARCHTERM
		{$$ = new yy.SearchTerm($3, $1);}
    | '(' QRY ')'
        {$$ = $2;}
    ;