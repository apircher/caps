using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Caps.Data.Utils
{
    public static class SqlTableChangeTracking
    {
        public static void InitializeChangeTracking(Caps.Data.CapsDbContext context)
        {
            context.DropTableIfExists("ChangeTracking");
            context.Database.ExecuteSqlCommand(@"
CREATE TABLE [dbo].[ChangeTracking] (
    [TableName]  VARCHAR (150) NOT NULL,
    [ModifiedAt] DATETIME      NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[TableName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)
)");
            context.Database.ExecuteSqlCommand("ALTER TABLE [dbo].[ChangeTracking] ADD  DEFAULT (getdate()) FOR [ModifiedAt]");
            context.CreateChangeTrackingTrigger("DbSiteMaps");
            context.CreateChangeTrackingTrigger("DbSiteMapNodes");
            context.CreateChangeTrackingTrigger("DbSiteMapNodeResources");
            context.CreateChangeTrackingTrigger("Publications");
        }

        static void CreateChangeTrackingTrigger(this Caps.Data.CapsDbContext context, String tableName)
        {
            String triggerName = String.Format("{0}_ChangeTracking", tableName);
            context.DropTriggerIfExists(triggerName);
            
            String cmdText = String.Format(@"
CREATE TRIGGER [{0}_ChangeTracking]
	ON [dbo].[{0}]
	FOR DELETE, INSERT, UPDATE
	AS
	BEGIN
		SET NOCOUNT ON
		IF (EXISTS(SELECT ModifiedAt FROM ChangeTracking WHERE TableName = N'{0}'))
			UPDATE ChangeTracking SET ModifiedAt = getdate() WHERE TableName = N'{0}';
		ELSE
			INSERT ChangeTracking (TableName, ModifiedAt) VALUES (N'{0}', getdate());
	END
", tableName);
            context.Database.ExecuteSqlCommand(cmdText);
        }

        static void DropTriggerIfExists(this Caps.Data.CapsDbContext context, String name) 
        {
            String cmdText = String.Format(@"
IF EXISTS (SELECT * FROM sysobjects WHERE name='{0}') 
BEGIN
  DROP TRIGGER [dbo].[{0}];
END", name);
            context.Database.ExecuteSqlCommand(cmdText);
        }
        static void DropTableIfExists(this Caps.Data.CapsDbContext context, String name) 
        {
            String cmdText = String.Format(@"
IF EXISTS (SELECT * FROM sysobjects WHERE name='{0}') 
BEGIN
  DROP TABLE [dbo].[{0}];
END", name);
            context.Database.ExecuteSqlCommand(cmdText);
        }
    }
}
