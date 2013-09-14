using Caps.Data.Model;
using Caps.Web.UI.Infrastructure;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Web;

namespace Caps.Web.UI.Models
{
    public abstract class FilterOptions<T> 
    {
        public FilterValue[] Filters { get; set; }

        public Expression<Func<T, bool>> GetPredicate()
        {
            List<Expression> preds = new List<Expression>();
            foreach (var filter in Filters)
            {
                var pb = PredicateBuilderFactory.GetPredicateBuilder(filter);
                preds.Add(pb.BuildPredicate(filter));
            }
            return (Expression<Func<T, bool>>)preds.Cast<Expression>().Aggregate((e1, e2) => Expression.AndAlso(e1, e2));
        }
    }
    public class FilterValue 
    {
        public String FilterName { get; set; }
        public String[] Values { get; set; }
    }
}