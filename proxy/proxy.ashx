<%@ WebHandler Language="C#" Class="proxy" %>

using System;
using System.Web;
using System.Net;
using System.IO;
using System.Text;

public class proxy : IHttpHandler {

    public void ProcessRequest (HttpContext context) {
        if (string.IsNullOrEmpty(context.Request["URL"])) return;
        string rurl = context.Request.Form.Get("url");
        string filter = context.Request.Form.Get("filter");
        string layerName=context.Request.Form.Get("layerName");
        string requestUrl = rurl + filter;
        HttpWebRequest request = WebRequest.Create(new Uri(requestUrl)) as HttpWebRequest;
        request.UserAgent = context.Request.UserAgent;
        request.ContentType = context.Request.ContentType;
        request.Method = context.Request.HttpMethod;

        byte[] trans = new byte[1024];
        int offset = 0;
        int offcnt = 0;

        if (request.Method.ToUpper() == "POST")
        {
            Stream nstream = request.GetRequestStream();
            while (offset < context.Request.ContentLength)
            {
                offcnt = context.Request.InputStream.Read(trans, offset, 1024);
                if (offcnt > 0)
                {
                    nstream.Write(trans, 0, offcnt);
                    offset += offcnt;
                }
            }
            nstream.Close();
        }
        HttpWebResponse response = (HttpWebResponse)request.GetResponse();
        //Encoding enc = Encoding.GetEncoding(65001);
        context.Response.ContentType = response.ContentType;
        Stream st = response.GetResponseStream();
        StreamReader loResponseStream = new StreamReader(response.GetResponseStream());
        string lcHtml = loResponseStream.ReadToEnd();
        if (layerName != null){
            lcHtml = layerName + "_layerName_" + lcHtml;

        }
        //Encoding.UTF8.GetString()

        context.Response.Write(lcHtml);
        response.Close();
        loResponseStream.Close();
    }

    public bool IsReusable {
        get {
            return false;
        }
    }
}