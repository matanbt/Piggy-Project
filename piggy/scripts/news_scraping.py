import requests
from bs4 import BeautifulSoup as bs
from pandas import DataFrame, Series
import pandas as pd
import os
import datetime

AXIS_LABELS = ["Channel", "Title", "Tags", 'URL']
MAX_ARTICLES = 5
COUNTRIES_DICT=None
UPDATE_DELTA = 2000 #seconds
ABS_PATH=os.path.dirname(__file__)


def getCountriesDict():
    global COUNTRIES_DICT

    if not COUNTRIES_DICT:
        df = pd.read_json(open(ABS_PATH+r'\countries.json'))
        df['name']=df["name"].apply(str.lower)
        df['code']=df["code"].apply(str.lower)
        COUNTRIES_DICT=df.set_index('name').to_dict()['code']
    return COUNTRIES_DICT


def getSoup(url):
    # open connection and grab html
    html_page = requests.get(url).content

    # parse the html with BeautifulSoup
    page_bs = bs(html_page, "html.parser")
    return page_bs


def get_world_bbc():
    out_df = DataFrame()
    url = "https://www.bbc.com/news/world"
    souped = getSoup(url)
    to_inspect = [souped.find_all("div", {  # headline
        'class': 'gs-c-promo gs-t-News nw-c-promo gs-o-faux-block-link gs-u-pb gs-u-pb+@m nw-p-default '
                 'gs-c-promo--inline@m gs-c-promo--stacked@xxl gs-c-promo--flex'})[0]]

    to_inspect += souped.find_all("div", {  # sub-titles
        'class': 'gs-c-promo-body gs-u-mt@xxs gs-u-mt@m gs-c-promo-body--flex gs-u-mt@xs gs-u-mt0@xs gs-u-mt@m '
                 'gel-1/2@xs gel-1/1@s'})

    for i in range(MAX_ARTICLES + 2):
        title = to_inspect[i].find_all("h3")[0].text
        desc = to_inspect[i].find_all("p")[0].text
        article_url = "https://www.bbc.com" + to_inspect[i].find_all("a")[0]['href']
        tags = getSoup(article_url).find_all("div", {'class': 'tags-container'})
        if len(tags) == 0:
            continue
        tags = tuple([tag.text for tag in tags[-1].find_all('a')])
        out_df = out_df.append(Series(["BBC", title + " " + desc, tags, article_url]), ignore_index=True)
    out_df = out_df.set_axis(AXIS_LABELS, axis=1)
    return out_df


def get_world_skynews():
    out_df = DataFrame()
    url = "https://news.sky.com/world"
    souped = getSoup(url)
    title_divs = souped.findAll("a", {"class": "sdc-site-tile__headline-link"})
    for i in range(MAX_ARTICLES):
        title = title_divs[i].text
        article_url = "https://news.sky.com/" + title_divs[i]['href']
        article_paras = getSoup(article_url).find_all("p")[2:]
        text = ""
        for para in article_paras[:20]:
            text += str(para.text)
        country = find_first_referenced_country(title + " " + text)
        out_df = out_df.append(Series(["Sky", title.strip(), (country,), article_url]), ignore_index=True)

    out_df = out_df.set_axis(AXIS_LABELS, axis=1)
    return out_df


def get_world_guardian():
    out_df = DataFrame()

    url = "https://www.theguardian.com/world"
    souped = getSoup(url)
    articles = souped.find_all("a", {'data-link-name': 'article'})[1:]

    def get_topics_guardian(a_url):
        tags = getSoup(a_url).find("div", {'class': 'submeta__keywords'}). \
            parent.find_all("a", {"class": "submeta__link"})
        return tuple([tag.text.strip() for tag in tags[:-1]])

    for i in range(MAX_ARTICLES + 3):
        title = articles[i].text
        if out_df.shape != (0, 0) and title in out_df[1].values:
            continue
        a_url = articles[i]['href']  # continue on duplicates in a row
        tags = None
        try:
            tags = get_topics_guardian(a_url)
        except:
            try:
                tags = get_topics_guardian(a_url)
            except:
                pass
        out_df = out_df.append(Series(["Guardian", title, tags, a_url]), ignore_index=True)

    out_df = out_df.set_axis(AXIS_LABELS, axis=1)
    return out_df


def find_first_referenced_country(text):
    countries_dict = getCountriesDict()
    for word in text.split():
        word = word.translate(str.maketrans('', '', ":,/;()."))
        if word == 'UK':
            return 'united kingdom'
        if word == 'US':
            return 'united states'
        if word.lower() in countries_dict:
            return word.lower()

def get_countries_id_from_df(df):
    """returns set with IDs of countries showed in articles tags of given DF"""
    countries_names=set()
    countries_dict=getCountriesDict()
    for i,row in df.iterrows():
        tags=str(row['Tags']) # string of tags-tuple
        for tag in tags.translate(str.maketrans('','',"'()")).split(','):
            tag=tag.strip().lower()
            if tag in countries_dict:
                countries_names.add(tag)
    return {countries_dict[c] for c in countries_names},countries_names

def get_actual_data(last_updated=None):
    """ returns Tuple of 3 DataFrames each with news scraped from another channel,
    boolean value is True iff Data was Updated """
    if not last_updated or (datetime.datetime.now()-last_updated).seconds > UPDATE_DELTA:
        df_tuple = get_world_bbc(), get_world_skynews(), get_world_guardian()
        save_to_csv(df_tuple)
        return df_tuple, True
    #else - can extract data from 'output.csv'
    df=pd.read_csv(open('output.csv'))
    return (df[df['Channel']=="BBC"].reset_index(drop=True),
            df[df['Channel']=="Sky"].reset_index(drop=True),df[df['Channel']=="Guardian"].reset_index(drop=True)),False

def save_to_csv(df):
    try:
        (df[0].append(df[1].append(df[2]))).to_csv("output.csv",index=False)
    except:
        print('Exception writing to Output.csv in func: save_to_csv')

if __name__=="__main__":
    get_actual_data()
