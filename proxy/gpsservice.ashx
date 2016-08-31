<%@ WebHandler Language="C#" Class="gpsservice" %>

using System;
using System.Web;
using System.Data;
using Geo.DBUtility;

public class gpsservice : IHttpHandler {
    private HttpResponse Response;
    private HttpRequest Request;
    public void ProcessRequest (HttpContext context) {
        Response = context.Response;
        string from = context.Request.Form.Get("from");
        string to = context.Request.Form.Get("to");
        Request = context.Request;
        //switch (Request["type"].ToString())
        //{
        //    case "1":
        //        Getdata();
        //        break;

        //}
        Getdata(from, to);
    }
    void Getdata(string from,string to) {
        string sql = "select * from m_gpstrack_v where TIME>to_date('" + from + "','yyyy-mm-dd hh24:mi:ss') and TIME<to_date('" + to + "','yyyy-mm-dd hh24:mi:ss')";
        DataTable dt= Geo.DBUtility.DbHelperOra.QueryDT(sql);
        if (dt != null && dt.Rows.Count > 0)
        {
            string s = DataToJsonString.DataTableToJsonString(dt);
            Response.Write(s);
        }
        else
        {
            Response.Write("\"\"");
        }
    }

    public bool IsReusable {
        get {
            return false;
        }
    }
}