using System;
using System.Collections;
using System.Collections.Generic;
using System.Web;
using System.Data;
using System.Text;

/// <summary>
///DataToJsonString 的摘要说明：将数据集DataTable反序列化成json字符串
/// </summary>
public class DataToJsonString
{
    public DataToJsonString()
    {
        //
        //TODO: 在此处添加构造函数逻辑
        //
    }

    #region json字符串加密算法，防止特殊符号引起的json结构错误移除
    /// <summary>
    /// json字符串加密算法，防止特殊符号引起的json结构错误移除
    /// </summary>
    /// <param name="json">json字符串</param>
    /// <returns>返回加密json字符串</returns>
    public static string JsonEscape(string json)
    {
        StringBuilder sJson = new StringBuilder();
        byte[] byteArr = System.Text.Encoding.Unicode.GetBytes(json);
        for (int i = 0; i < byteArr.Length; i += 2)
        {
            sJson.Append("%u");
            sJson.Append(byteArr[i + 1].ToString("X2")); //把字节转换为十六进制的字符串表现形式
            sJson.Append(byteArr[i].ToString("X2"));
        }
        return sJson.ToString();
    }
    #endregion

    #region json字符串解密算法
    /// <summary>
    /// json字符串解密算法
    /// </summary>
    /// <param name="json">json加密字符串</param>
    /// <returns>返回解密json字符串</returns>
    public static string JsonUnEscape(string json)
    {
        string str = json.Remove(0, 2); //删除最前面两个"%u"
        string[] strArr = str.Split(new string[] { "%u" }, StringSplitOptions.None); //以子字符串"%u"分隔
        byte[] byteArr = new byte[strArr.Length * 2];
        for (int i = 0, j = 0; i < strArr.Length; i++, j += 2)
        {
            byteArr[j + 1] = Convert.ToByte(strArr[i].Substring(0, 2), 16); //把十六进制形式的字串符串转换为二进制字节
            byteArr[j] = Convert.ToByte(strArr[i].Substring(2, 2), 16);
        }
        str = System.Text.Encoding.Unicode.GetString(byteArr);　//把字节转为unicode编码
        return str;
    }
    #endregion

    #region 将DataTable数据集序列化JSon格式字符串
    /// <summary>
    /// 将DataTable数据集序列化JSon格式字符串
    /// </summary>
    /// <param name="dt">DataTable数据集</param>
    /// <returns>返回JSon格式字符串</returns>
    public static string DataTableToJsonString(DataTable dt)
    {
        StringBuilder json = new StringBuilder();
        json.Append("{ \"TABLE\": [ ");
        for (int i = 0; i < dt.Rows.Count; i++)
        {
            json.Append("{ ");
            for (int j = 0; j < dt.Columns.Count; j++)
            {
                if (j == dt.Columns.Count - 1)
                    json.Append("\"" + dt.Columns[j].ColumnName.ToString() + "\": \"" + JsonEscape(dt.Rows[i][j].ToString()) + "\" ");
                else
                    json.Append("\"" + dt.Columns[j].ColumnName.ToString() + "\": \"" + JsonEscape(dt.Rows[i][j].ToString()) + "\", ");
            }
            if (i == dt.Rows.Count - 1)
                json.Append("} ");
            else
                json.Append("}, ");
        }
        json.Append("] }");
        return json.ToString();
    }
    #endregion

    #region 带总行数的DataTable数据集序列化JSon格式字符串
    /// <summary>
    /// 带总行数的DataTable数据集序列化JSon格式字符串
    /// </summary>
    /// <param name="dt">DataTable数据集</param>
    /// <param name="nCount">数据集总行数</param>
    /// <returns>返回JSon格式字符串</returns>
    public static string DataTableToJsonString(DataTable dt, int nCount)
    {
        StringBuilder json = new StringBuilder();
        json.Append("{ \"COUNT\": \"" + JsonEscape(nCount.ToString()) + "\", \"TABLE\": [ ");
        for (int i = 0; i < dt.Rows.Count; i++)
        {
            json.Append("{ ");
            for (int j = 0; j < dt.Columns.Count; j++)
            {
                if (j == dt.Columns.Count - 1)
                    json.Append("\"" + dt.Columns[j].ColumnName.ToString() + "\": \"" + JsonEscape(dt.Rows[i][j].ToString()) + "\" ");
                else
                    json.Append("\"" + dt.Columns[j].ColumnName.ToString() + "\": \"" + JsonEscape(dt.Rows[i][j].ToString()) + "\", ");
            }
            if (i == dt.Rows.Count - 1)
                json.Append("} ");
            else
                json.Append("}, ");
        }
        json.Append("] }");
        return json.ToString();
    }
    #endregion

    #region 带合计行与总行数的DataTable数据集序列化JSon格式字符串
    /// <summary>
    /// 带合计行与总行数的DataTable数据集序列化JSon格式字符串
    /// </summary>
    /// <param name="dt">DataTable数据集</param>
    /// <param name="table">合计行数据集</param>
    /// <param name="nCount">数据集总行数</param>
    /// <returns>返回JSon格式字符串</returns>
    public static string DataTableToJsonString(DataTable dt, DataTable table, int nCount)
    {
        StringBuilder json = new StringBuilder();
        json.Append("{ \"COUNT\": \"" + JsonEscape(nCount.ToString()) + "\", \"TABLE\": [ ");
        for (int i = 0; i < dt.Rows.Count; i++)
        {
            json.Append("{ ");
            for (int j = 0; j < dt.Columns.Count; j++)
            {
                if (j == dt.Columns.Count - 1)
                    json.Append("\"" + dt.Columns[j].ColumnName.ToString() + "\": \"" + JsonEscape(dt.Rows[i][j].ToString()) + "\" ");
                else
                    json.Append("\"" + dt.Columns[j].ColumnName.ToString() + "\": \"" + JsonEscape(dt.Rows[i][j].ToString()) + "\", ");
            }
            if (i == dt.Rows.Count - 1)
                json.Append("} ");
            else
                json.Append("}, ");
        }
        json.Append("], \"SUM\": [{ ");
        for (int i = 0; i < table.Columns.Count; i++)
        {
            if (i == table.Columns.Count - 1)
                json.Append("\"" + table.Columns[i].ColumnName.ToString() + "\": \"" + JsonEscape(table.Rows[0][i].ToString()) + "\" ");
            else
                json.Append("\"" + table.Columns[i].ColumnName.ToString() + "\": \"" + JsonEscape(table.Rows[0][i].ToString()) + "\", ");
        }
        json.Append("}] }");
        return json.ToString();
    }
    #endregion

    #region 带自定义返回值的DataTable数据集序列化JSon格式字符串
    /// <summary>
    /// 带自定义返回值的DataTable数据集序列化JSon格式字符串
    /// </summary>
    /// <param name="dt">DataTable数据集</param>
    /// <param name="ht">自定义返回值</param>
    /// <returns>返回JSon格式字符串</returns>
    public static string DataTableToJsonString(DataTable dt, Hashtable ht)
    {
        StringBuilder json = new StringBuilder();
        json.Append("{ \"TABLE\": [ ");
        for (int i = 0; i < dt.Rows.Count; i++)
        {
            json.Append("{ ");
            for (int j = 0; j < dt.Columns.Count; j++)
            {
                if (j == dt.Columns.Count - 1)
                    json.Append("\"" + dt.Columns[j].ColumnName.ToString() + "\": \"" + JsonEscape(dt.Rows[i][j].ToString()) + "\" ");
                else
                    json.Append("\"" + dt.Columns[j].ColumnName.ToString() + "\": \"" + JsonEscape(dt.Rows[i][j].ToString()) + "\", ");
            }
            if (i == dt.Rows.Count - 1)
                json.Append("} ");
            else
                json.Append("}, ");
        }
        json.Append("], \"OTHER\": { ");
        string temp = string.Empty;
        foreach (DictionaryEntry obj in ht)
        {
            temp += "\"" + obj.Key.ToString() + "\": \"" + JsonEscape(obj.Value.ToString()) + "\", ";
        }
        temp = temp.Substring(0, temp.Length - 2);
        json.Append(temp + "} }");
        return json.ToString();
    }
    #endregion

    #region 带自定义返回值与总行数的DataTable数据集序列化JSon格式字符串
    /// <summary>
    /// 带自定义返回值与总行数的DataTable数据集序列化JSon格式字符串
    /// </summary>
    /// <param name="dt">DataTable数据集</param>
    /// <param name="nCount">数据集总行数</param>
    /// <param name="ht">自定义返回值</param>
    /// <returns>返回JSon格式字符串</returns>
    public static string DataTableToJsonString(DataTable dt, int nCount, Hashtable ht)
    {
        StringBuilder json = new StringBuilder();
        json.Append("{ \"COUNT\": \"" + JsonEscape(nCount.ToString()) + "\", \"TABLE\": [ ");
        for (int i = 0; i < dt.Rows.Count; i++)
        {
            json.Append("{ ");
            for (int j = 0; j < dt.Columns.Count; j++)
            {
                if (j == dt.Columns.Count - 1)
                    json.Append("\"" + dt.Columns[j].ColumnName.ToString() + "\": \"" + JsonEscape(dt.Rows[i][j].ToString()) + "\" ");
                else
                    json.Append("\"" + dt.Columns[j].ColumnName.ToString() + "\": \"" + JsonEscape(dt.Rows[i][j].ToString()) + "\", ");
            }
            if (i == dt.Rows.Count - 1)
                json.Append("} ");
            else
                json.Append("}, ");
        }
        json.Append("], \"OTHER\": { ");
        string temp = string.Empty;
        foreach (DictionaryEntry obj in ht)
        {
            temp += "\"" + obj.Key.ToString() + "\": \"" + JsonEscape(obj.Value.ToString()) + "\", ";
        }
        temp = temp.Substring(0, temp.Length - 2);
        json.Append(temp + "} }");
        return json.ToString();
    }
    #endregion

    #region 带自定义返回值、合计行与总行数的DataTable数据集序列化JSon格式字符串
    /// <summary>
    /// 带自定义返回值、合计行与总行数的DataTable数据集序列化JSon格式字符串
    /// </summary>
    /// <param name="dt">DataTable数据集</param>
    /// <param name="table">合计行数据集</param>
    /// <param name="nCount">数据集总行数</param>
    /// <param name="ht">自定义返回值</param>
    /// <returns>返回JSon格式字符串</returns>
    public static string DataTableToJsonString(DataTable dt, DataTable table, int nCount, Hashtable ht)
    {
        StringBuilder json = new StringBuilder();
        json.Append("{ \"COUNT\": \"" + JsonEscape(nCount.ToString()) + "\", \"TABLE\": [ ");
        for (int i = 0; i < dt.Rows.Count; i++)
        {
            json.Append("{ ");
            for (int j = 0; j < dt.Columns.Count; j++)
            {
                if (j == dt.Columns.Count - 1)
                    json.Append("\"" + dt.Columns[j].ColumnName.ToString() + "\": \"" + JsonEscape(dt.Rows[i][j].ToString()) + "\" ");
                else
                    json.Append("\"" + dt.Columns[j].ColumnName.ToString() + "\": \"" + JsonEscape(dt.Rows[i][j].ToString()) + "\", ");
            }
            if (i == dt.Rows.Count - 1)
                json.Append("} ");
            else
                json.Append("}, ");
        }
        json.Append("], \"SUM\": [{ ");
        for (int i = 0; i < table.Columns.Count; i++)
        {
            if (i == table.Columns.Count - 1)
                json.Append("\"" + table.Columns[i].ColumnName.ToString() + "\": \"" + JsonEscape(table.Rows[0][i].ToString()) + "\" ");
            else
                json.Append("\"" + table.Columns[i].ColumnName.ToString() + "\": \"" + JsonEscape(table.Rows[0][i].ToString()) + "\", ");
        }
        json.Append("], \"OTHER\": { ");
        string temp = string.Empty;
        foreach (DictionaryEntry obj in ht)
        {
            temp += "\"" + obj.Key.ToString() + "\": \"" + JsonEscape(obj.Value.ToString()) + "\", ";
        }
        temp = temp.Substring(0, temp.Length - 2);
        json.Append(temp + "} }");
        return json.ToString();
    }
    #endregion

    #region 自定义数据集合序列化JSon格式字符串
    /// <summary>
    /// 自定义数据集合序列化JSon格式字符串
    /// </summary>
    /// <param name="ht">自定义返回值</param>
    /// <returns>返回JSon格式字符串</returns>
    public static string DataTableToJsonString(Hashtable ht)
    {
        StringBuilder json = new StringBuilder();
        json.Append("{ ");
        string temp = string.Empty;
        foreach (DictionaryEntry obj in ht)
        {
            temp += "\"" + obj.Key.ToString() + "\": \"" + JsonEscape(obj.Value.ToString()) + "\", ";
        }
        temp = temp.Substring(0, temp.Length - 2);
        json.Append(temp + " }");
        return json.ToString();
    }
    #endregion

    #region 将DataSet数据集合序列化JSon格式字符串
    /// <summary>
    /// 将DataSet数据集合序列化JSon格式字符串
    /// </summary>
    /// <param name="ds">DataSet数据集合</param>
    /// <returns>返回JSon格式字符串</returns>
    public static string DataTableToJsonString(DataSet ds)
    {
        StringBuilder json = new StringBuilder();
        json.Append("{ ");
        foreach (DataTable dt in ds.Tables)
        {
            json.Append("\"" + dt.TableName + "\": [ ");
            foreach (DataRow dr in dt.Rows)
            {
                json.Append("{ ");
                for (int i = 0, len = dt.Columns.Count; i < len; i++)
                {
                    if (i == dt.Columns.Count - 1)
                        json.Append("\"" + dt.Columns[i].ColumnName + "\": \"" + JsonEscape(dr[i].ToString()) + "\" ");
                    else
                        json.Append("\"" + dt.Columns[i].ColumnName + "\": \"" + JsonEscape(dr[i].ToString()) + "\", ");
                }
                json.Append(" }, ");
            }
            json.Remove(json.Length - 2, 2);
            json.Append(" ], ");
        }
        json.Remove(json.Length - 2, 2);
        json.Append(" }");
        return json.ToString();
    } 
    #endregion

    #region 带表总行数的DataSet转换为JSON字符串（前台解密需要对每张表分别解密）
    /// <summary>
    /// dataset转换为json字符串
    /// </summary>
    /// <param name="ds"></param>
    /// <returns></returns>
    public static string DataSetToJsonString(DataSet ds)
    {
        StringBuilder json = new StringBuilder();
        json.Append("{");
        foreach (DataTable dt in ds.Tables)
        {
            //json.Append("{ \"COUNT\": \"" + JsonEscape(dt.Rows.Count.ToString()) + "\", \"" + dt.TableName + "\": [ ");
            json.Append("\"" + dt.TableName + "\":{ \"COUNT\": \"" + JsonEscape(dt.Rows.Count.ToString()) + "\", \"TABLE\": [");
            foreach (DataRow dr in dt.Rows)
            {
                json.Append("{ ");
                for (int i = 0; i < dt.Columns.Count; i++)
                {
                    json.Append("\"" + dt.Columns[i].ColumnName + "\":\"" + JsonEscape(Convert.ToString(dr[i])) + "\",");
                }
                json.Remove(json.Length - 1, 1);
                json.Append(" },");
            }
            if (dt.Rows.Count != 0)
            {
                json.Remove(json.Length - 1, 1);
            }
            json.Append("]},");
        }
        json.Remove(json.Length - 1, 1);
        json.Append("}");
        return json.ToString();
    }
    #endregion
}