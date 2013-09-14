using Caps.Data.Model;
using Caps.Web.UI.Infrastructure;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Web;

namespace Caps.Web.UI.Models
{
    public class FilesFilterOptions : FilterOptions<DbFile>
    {
        static FilesFilterOptions() 
        {
            PredicateBuilderFactory.RegisterBuilder("DbFileTags", new FileTagFilterPredicateBuilder());
        }

        public static FilesFilterOptions Parse(String s) 
        {
            var result = new FilesFilterOptions();
            result.Filters = new[] { new FilterValue { FilterName = "DbFileTags", Values = s.Split('|').Select(x => x.Trim()).ToArray() } };
            return result;
        }
    }

    public class FileTagFilterPredicateBuilder : IPredicateBuilder 
    {
        public Expression BuildPredicate(FilterValue value)
        {
            var item = Expression.Parameter(typeof(DbFileTag), "f");
            var itemProperty = Expression.Property(item, "TagId");
            var method = typeof(int).GetMethod("Equals", new[] { typeof(int) });

            List<int> tagIds = value.Values.Select(s =>
            {
                int i;
                if (int.TryParse(s, out i))
                    return i;
                return -1;
            })
            .Where(i => i >= 0)
            .ToList();

            List<Expression> ve = tagIds.Select(v =>
            {
                var expr = Expression.Constant(v, typeof(int));
                return Expression.Call(itemProperty, method, new[] { expr });
            })
            .Cast<Expression>()
            .ToList();

            var lambda = Expression.Lambda<Func<DbFileTag, bool>>(
                ve.Cast<Expression>().Aggregate((e1, e2) => Expression.OrElse(e1, e2)), item);

            var outerItem = Expression.Parameter(typeof(DbFile), "m");
            var outerProperty = Expression.Property(outerItem, "Tags");
            var outerMethodExpr = Expression.Call(typeof(Enumerable), "Any", new[] { typeof(DbFileTag) }, outerProperty, lambda);
            var outerLambda = Expression.Lambda<Func<DbFile, bool>>(outerMethodExpr, outerItem);

            return outerLambda;
        }
    }
}