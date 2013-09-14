using Caps.Web.UI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Web;

namespace Caps.Web.UI.Infrastructure
{
    public static class PredicateBuilderFactory
    {
        static Dictionary<String, IPredicateBuilder> builders = new Dictionary<String, IPredicateBuilder>();

        public static void RegisterBuilder(String key, IPredicateBuilder builder)
        {
            var k = key.ToLower();
            if (builders.ContainsKey(k))
                builders[k] = builder;
            else
                builders.Add(k, builder);
        }

        public static IPredicateBuilder GetPredicateBuilder(FilterValue value)
        {
            var k = value.FilterName.ToLower();
            if (builders.ContainsKey(k))
                return builders[k];
            throw new ArgumentException("No IPredicateBuilder class found for " + value.FilterName);
        }
    }
    public interface IPredicateBuilder
    {
        Expression BuildPredicate(FilterValue value);
    }
}