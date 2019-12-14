import requests
import re
import json
import mysql.connector as sqldb
import sys

# http://d1.weather.com.cn/weather_index/101210101.html?_=1576217126106
# <span class="tempNum" id="temp" n="101210101">15</span>
headers = {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    # 'Cookie': 'UM_distinctid=16efbae577b68-0a6094452d9589-2393f61-1fa400-16efbae577c844; f_city=%E5%A4%A9%E6%B4%A5%7C101030100%7C; Hm_lvt_26f859e26fb1d9afca60151d2d1fe304=1576180718; Wa_lvt_1=1576180537,1576180560,1576215597,1576216994; Wa_lpvt_1=1576216994; Hm_lvt_080dabacb001ad3dc8b9b9049b36d43b=1576180560,1576215597,1576216994,1576217126; Hm_lpvt_080dabacb001ad3dc8b9b9049b36d43b=1576217126',
    'Host': 'd1.weather.com.cn',
    'Proxy-Connection': 'keep-alive',
    'Referer': 'http://www.weather.com.cn/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36',
}


def get_weather():
    pattern = re.compile(
        r'<span class="tempNum" id="temp" n=".*?">(.*)</span>')
    url = 'http://d1.weather.com.cn/weather_index/101210101.html'
    res = requests.get(url, headers=headers)
    # temperature = re.findall(pattern, res.text)
    # print(res.encoding)
    # print(res.text.encode('ISO-8859-1').decode('utf-8'))
    info = res.text.encode('ISO-8859-1').decode('utf-8')
    # print(info)

    pattern = re.compile(r'var.*?=.*?(\{.*?\});')
    contents = re.findall(pattern, info)[0]
    # print(contents)
    # print(contents)
    # print(type(json.loads(contents)))

    return json.loads(contents)


def conn_database(name, content):
    conn = sqldb.connect(
        user='root',
        password='xzh19981118',
        database='safehome',
        host='localhost',
        port='3306'
    )
    cursor = conn.cursor()
    try:
        cursor.execute(
            'insert into weather(name,cityname,temp,tempn,weather,wd,ws,fctime)' +
            'values("'+name +
            '","'+content["weatherinfo"]["cityname"] +
            '","'+content["weatherinfo"]["temp"] +
            '","'+content["weatherinfo"]["tempn"] +
            '","'+content["weatherinfo"]["weather"] +
            '","'+content["weatherinfo"]["wd"] +
            '","'+content["weatherinfo"]["ws"] +
            '","'+content["weatherinfo"]["fctime"] +
            '");'
        )
        conn.commit()
    except Exception as err:
        print(err)

    cursor.close()


if __name__ == '__main__':

    content = get_weather()
    # print(content)
    # print(content['weatherinfo']['cityname'])
    if content:
        conn_database(sys.argv[1], content)
