<%@ WebHandler Language="C#" Class="GetGPSData" %>

using System;
using System.Web;
using System.Net;
using System.Xml;
using System.Collections.Generic;
using Newtonsoft.Json;

public class GetGPSData : IHttpHandler {
    private XmlNodeList RowNodes = null;
    public void ProcessRequest (HttpContext context) {
        if (string.IsNullOrEmpty(context.Request["URL"])) return;
        RowCollection rows = new RowCollection();
        if (RowNodes == null){
            XmlDocument doc = new XmlDocument();
            rows.Rows = new List<Row>();
            doc.Load("http://localhost/maptalks-demo/test_data/gps20160818.xml");    //加载Xml文件  
            XmlElement rootElem = doc.DocumentElement;   //获取根节点  
            RowNodes = rootElem.GetElementsByTagName("ROW"); //获取ROW子节点集合  
        }
        int rowCount = RowNodes.Count;
        int count = 15000;
        for(int i = 0; i < count; i++)
        {
            XmlNode node = RowNodes[i];
            Row row = new Row();
            row.USERID = Convert.ToInt32(getXmlValue("USERID", node));
            row.COORX = Convert.ToDouble(getXmlValue("COORX", node));
            row.COORY = Convert.ToDouble(getXmlValue("COORY", node));
            row.TIME = getXmlValue("TIME", node);
            row.SPEED = Convert.ToDouble(getXmlValue("SPEED", node));
            row.YAW = Convert.ToInt32(getXmlValue("YAW", node));
            rows.Rows.Add(row);
        }
        string json = JsonConvert.SerializeObject(rows);
        context.Response.Write(json);
    }

    private string getXmlValue(string tagName,XmlNode node){
        string value = null;
        XmlNodeList nodeList = ((XmlElement)node).GetElementsByTagName(tagName);
        if (nodeList.Count == 1){
            value = nodeList[0].InnerText;
        }
        return value;
    }

    public bool IsReusable {
        get {
            return false;
        }
    }
}

public class Row
{
    public int USERID { get; set; }

    public double COORX { get; set; }

    public double COORY { get; set; }

    public string TIME { get; set; }

    public double SPEED { get; set; }

    public int YAW { get; set; }
}

public class RowCollection
{
    public System.Collections.Generic.IList<Row> Rows { get; set; }
}