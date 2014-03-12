using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Caching;

namespace Caps.Consumer.Mvc.Utils
{
    public class PollingCacheDependency : CacheDependency
    {
        System.Timers.Timer timer;
        String connectionStringName;
        String tableNames;
        DateTime currentValue;

        public PollingCacheDependency(double interval, String connectionStringName, params String[] tableNames)
        {
            this.tableNames = String.Join(", ", tableNames.Select(n => String.Format("N'{0}'", n)).ToArray());
            this.connectionStringName = connectionStringName;
            this.currentValue = GetLastModified();

            interval = Math.Max(interval, 10000);
            timer = new System.Timers.Timer(interval);
            timer.Elapsed += timer_Elapsed;
            timer.Enabled = true;

            FinishInit();
        }

        void timer_Elapsed(object sender, System.Timers.ElapsedEventArgs e)
        {
            var value = GetLastModified();
            if (value != currentValue)
            {
                NotifyDependencyChanged(this, EventArgs.Empty);
                currentValue = value;
            }
        }

        DateTime GetLastModified()
        {
            using (SqlConnection connection = new SqlConnection(ConfigurationManager.ConnectionStrings[connectionStringName].ConnectionString))
            {
                try
                {
                    connection.Open();
                    SqlCommand cmd = connection.CreateCommand();
                    cmd.CommandType = System.Data.CommandType.Text;
                    cmd.CommandText = String.Format("SELECT MAX([ModifiedAt]) FROM dbo.ChangeTracking WHERE [TableName] IN ({0})", tableNames);

                    object result = cmd.ExecuteScalar();
                    if (result != null && result != DBNull.Value)
                        return (DateTime)result;
                }
                catch (SqlException)
                {
                    //Todo: Log Exception...
                }
            }
            return DateTime.MinValue;
        }

        protected override void DependencyDispose()
        {
            if (timer != null)
            {
                timer.Enabled = false;
                timer.Dispose();
                timer = null;
            }

            base.DependencyDispose();
        }
    }
}
