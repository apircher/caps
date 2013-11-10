﻿using Caps.Data.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml;

namespace Caps.Data.ContentControls
{
    public class ContentScriptManager
    {
        List<String> dependencies;
        List<ScriptBlock> blocks;

        public ContentScriptManager()
        {
            blocks = new List<ScriptBlock>();
            dependencies = new List<String>();
        }

        public ScriptBlock FindScriptBlock(String name)
        {
            return blocks.FirstOrDefault(b => String.Equals(b.Name, name, StringComparison.OrdinalIgnoreCase));
        }
        public bool HasScriptBlock(String name)
        {
            return FindScriptBlock(name) != null;
        }
        public ScriptBlock RegisterScriptBlock(String name)
        {
            var scriptBlock = FindScriptBlock(name);
            if (scriptBlock != null)
                return scriptBlock;

            scriptBlock = new ScriptBlock { Name = name };
            blocks.Add(scriptBlock);
            return scriptBlock;
        }

        public void RegisterDependency(String dependency)
        {
            if (!dependencies.Contains(dependency))
                dependencies.Add(dependency);
        }
        public IList<String> Dependencies
        {
            get
            {
                return dependencies;
            }
        }
        public IList<ScriptBlock> Blocks
        {
            get
            {
                return blocks;
            }
        }

        public PublicationContentPart CreateContentPart()
        {
            var result = new PublicationContentPart { PartType = "Script" };
            var xml = ToXml();

            var resource = new PublicationContentPartResource
            {
                Language = Caps.Data.Localization.Language.DefaultLanguage,
                Content = xml
            };
            result.Resources.Add(resource);
            return result;
        }

        public String ToXml()
        {
            var xmlDocument = new XmlDocument();
            var root = xmlDocument.CreateElement("scriptContent");
            var attr = xmlDocument.CreateAttribute("dependencies");
            attr.Value = String.Join(";", dependencies.ToArray());
            root.Attributes.Append(attr);
            xmlDocument.AppendChild(root);

            foreach (var b in blocks)
            {
                var blockElement = xmlDocument.CreateElement("scriptBlock");
                attr = xmlDocument.CreateAttribute("name");
                attr.Value = b.Name;
                blockElement.Attributes.Append(attr);

                var scriptContent = xmlDocument.CreateCDataSection(b.Content);
                blockElement.AppendChild(scriptContent);
                root.AppendChild(blockElement);
            }
            return xmlDocument.InnerXml;
        }
        public void LoadXml(String xml)
        {
            var xmlDocument = new XmlDocument();
            xmlDocument.LoadXml(xml);

            var root = xmlDocument.DocumentElement;
            if (root == null || root.LocalName != "scriptContent")
                return;

            dependencies.Clear();
            var ds = root.Attributes["dependencies"].Value;
            if (!String.IsNullOrWhiteSpace(ds))
                dependencies.AddRange(ds.Split(';'));

            var blockElements = root.SelectNodes("./scriptBlock");
            foreach (XmlNode element in blockElements)
            {
                var name = element.Attributes["name"].Value;
                var content = ((XmlCDataSection)element.FirstChild).Value;
                blocks.Add(new ScriptBlock { Name = name, Content = content });
            }
        }

        public static ContentScriptManager FromContentPart(PublicationContentPart contentPart)
        {
            var resource = contentPart.Resources.FirstOrDefault(r => r.Language == Caps.Data.Localization.Language.DefaultLanguage);
            var result = new ContentScriptManager();
            result.LoadXml(resource.Content);
            return result;
        }
    }

    public class ScriptBlock
    {
        public String Name { get; set; }
        public String Content { get; set; }
    }
}