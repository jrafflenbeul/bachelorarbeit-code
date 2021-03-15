import io
import json
import base64
import dateutil.parser
from flask import Flask, Response, request, render_template
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
from matplotlib.figure import Figure
from matplotlib import cm as cm
from nltk.tokenize import word_tokenize
import numpy as np
import pandas as pd
from pandas.plotting import table
from collections import Counter

app = Flask(__name__)


@app.before_request
def before_request():
    print(request.method, request.endpoint)


@app.route('/title-optimization', methods=['POST'])
def title_optimization():
    request_data = request.json
    data = request_data["itemSummaries"]

    word_list = create_word_list(data)
    indices, values, labels = word_frequency_histogram(word_list)
    image = plot_histogram(indices, values, labels)
    base64_image = base64.b64encode(image)

    response = {
        "histogram": base64_image.decode("utf-8"),
        "values": values.tolist(),
        "labels": labels.tolist()
    }
    return Response(json.dumps(response), mimetype='application/json')


def plot_histogram(indices, values, labels):
    fig = create_histogram_figure(indices, values, labels)
    output = io.BytesIO()
    FigureCanvas(fig).print_png(output)
    return output.getvalue()


def create_histogram_figure(indices, values, labels):
    fig = Figure()
    axis = fig.add_subplot(111)
    bar_width = 0.35
    axis.bar(indices, values, bar_width,
             color='b')
    return fig


def create_word_list(data):
    word_list = []
    for item in data:
        tokenized_title = word_tokenize(item["title"])
        joined_list = [*word_list, *tokenized_title]
        word_list = joined_list
    return word_list


def word_frequency_histogram(word_list):
    counts = Counter(word_list)

    labels, values = zip(*counts.items())

    indSort = np.argsort(values)[::-1]

    labels = np.array(labels)[indSort]
    values = np.array(values)[indSort]

    indices = np.arange(len(labels))

    return indices, values, labels


@app.route('/price-performance', methods=['POST'])
def price_performance():
    request_data = request.json
    data = request_data["fetchedEbayApiData"]

    specifics = []
    specific_names = []
    specific_values = []

    for item in data:
        for specific in item["Specifics"]:
            specifics.append(specific)
            specific_names.append(specific["name"])
            specific_values.append(specific["value"])
        price = {"name": item["CurrentPrice"]["CurrencyID"],
                 "value": str(item["CurrentPrice"]["Value"])}
        specifics.append(price)
        specific_names.append(price["name"])
        specific_values.append(price["value"])

    specific_names_set = set(specific_names)

    d = dict.fromkeys(specific_names_set, [])

    j = 0
    while(j < len(specifics)):
        for entry in d:
            old_d = d[entry]
            new_d = [*old_d, None]
            d[entry] = new_d
        for entry in d:
            if specifics[j]["name"] in d:
                old_d = d[specifics[j]["name"]]
                try:
                    old_d[-1:] = [int(float(specifics[j]["value"]))]
                except:
                    old_d[-1:] = [None]
                d[specifics[j]["name"]] = old_d
            else:
                old_d = d[specifics[j]["name"]]
                old_d[-1:] = [None]
                d[specifics[j]["name"]] = old_d
            if(j == len(specifics) - 1):
                break
            j += 1
        if(j == len(specifics) - 1):
            break

    df_devices = pd.DataFrame.from_dict(d, orient="columns")

    descending_correlations = get_correlations(df_devices)

    try:
        image = plot_corr(df_devices, len(d))
        base64_image = base64.b64encode(image)

        response = {
            "image": base64_image.decode("utf-8"),
            "html": render_template('dataframe.html',  tables=[df_devices.to_html(classes='data', header="true")]),
            "correlations": descending_correlations.to_json()
        }
        return Response(json.dumps(response), mimetype='application/json')
    except TypeError:
        print("Error")


def intersection(list1, list2):
    list3 = [value["name"] for value in list1 if value["name"] in list2]
    return list3


def plot_corr(df, d_len):
    fig = create_corr_figure(df, d_len)
    output = io.BytesIO()
    FigureCanvas(fig).print_png(output)
    return output.getvalue()


def plot_table(df):
    fig = create_table_figure(df)
    output = io.BytesIO()
    FigureCanvas(fig).print_png(output)
    return output.getvalue()


def create_corr_figure(df, d_len):
    fig = Figure()
    ax1 = fig.add_subplot(111)
    cmap = cm.get_cmap('jet', d_len)
    cax = ax1.imshow(df.corr(), cmap=cmap)
    ax1.grid(True)
    ax1.set_title('Correlation Matrix')
    labels = df.keys()
    ax1.set_xticks(range(len(labels)))
    ax1.set_yticks(range(len(labels)))
    ax1.set_yticklabels(labels, fontsize=4)
    ax1.set_xticklabels(labels, fontsize=4, rotation=90)
    fig.colorbar(cax)
    return fig


def create_table_figure(df):
    fig = Figure()
    axis = fig.add_subplot(111, frame_on=False)
    table(axis, df)
    return fig


def get_correlations(df):
    corr_matrix = df.corr()
    sol = (corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(np.bool))
           .stack()
           .sort_values(ascending=False))
    return sol


@ app.route('/plot-data', methods=['POST'])
def plot_data():
    request_data = request.json
    data = request_data["fetchedEbayApiData"]
    ad_type = request_data["adType"]

    price_list = []
    start_date_list = []
    end_date_list = []
    delta_list = []
    if(ad_type == "Chinese"):
        for item in data:
            if "CurrentPrice" in item and "StartTime" in item and "EndTime" in item and item["ListingStatus"] == "Completed" and item["ListingType"] == "Chinese" or item["ListingType"] == "Auction" or item["ListingType"] == "PersonalOffer":
                handleAdType(item, price_list, start_date_list,
                             end_date_list, delta_list)
    if(ad_type == "FixedPriceItem"):
        for item in data:
            if "CurrentPrice" in item and "StartTime" in item and "EndTime" in item and item["ListingStatus"] == "Completed" and item["ListingType"] == "FixedPriceItem":
                handleAdType(item, price_list, start_date_list,
                             end_date_list, delta_list)
    if(ad_type == "Both"):
        for item in data:
            if "CurrentPrice" in item and "StartTime" in item and "EndTime" in item and item["ListingStatus"] == "Completed":
                handleAdType(item, price_list, start_date_list,
                             end_date_list, delta_list)

    np_price = np.array(price_list)
    np_delta = np.array(delta_list)

    if(ad_type == "Chinese"):
        plot_types = ["boxplot"]
        return evaluateAdType(np_price, np_delta, plot_types=plot_types)
    elif(ad_type == "FixedPriceItem"):
        plot_types = ["scatterplot", "regressionplot"]
        return evaluateAdType(np_price, np_delta, plot_types=plot_types)
    elif(ad_type == "Both"):
        plot_types = ["scatterplot"]
        return evaluateAdType(np_price, np_delta, plot_types=plot_types)


def evaluateAdType(np_price, np_delta, plot_types):
    image, zoomed_image, estimated_time_to_sell, estimated_price_to_sell = plot_image(
        np_price, np_delta, plot_types)
    base64_image = base64.b64encode(image)
    zoomed_base64_image = base64.b64encode(zoomed_image)
    response = {
        "image": base64_image.decode("utf-8"),
        "zoomedimage": zoomed_base64_image.decode("utf-8"),
        "ets": estimated_time_to_sell,
        "eps": estimated_price_to_sell
    }
    return Response(json.dumps(response), mimetype='application/json')


def handleAdType(item, price_list, start_date_list, end_date_list, delta_list):
    price_list.append(item["CurrentPrice"]["Value"])
    start_date_list.append(item["StartTime"])
    end_date_list.append(item["EndTime"])
    start_time = __datetime(item["StartTime"])
    end_time = __datetime(item["EndTime"])
    delta = end_time - start_time
    delta_list.append(delta.days)


def plot_image(np_price, np_delta, plot_types):
    fig, zoomed_fig, estimated_time_to_sell, estimated_price_to_sell = create_figure(
        np_price, np_delta, plot_types)
    output = io.BytesIO()
    zoomed_output = io.BytesIO()
    FigureCanvas(fig).print_png(output)
    FigureCanvas(zoomed_fig).print_png(zoomed_output)
    return output.getvalue(), zoomed_output.getvalue(), estimated_time_to_sell, estimated_price_to_sell


def create_figure(np_price, np_delta, plot_types):
    fig = Figure()
    zoomed_fig = Figure()
    axis = fig.add_subplot(1, 1, 1)
    zoomed_axis = zoomed_fig.add_subplot(1, 1, 1)

    m, b = np.polyfit(np_delta, np_price, 1)
    estimated_time_to_sell = calculate_estimated_time_to_sell(np_delta)
    estimated_price_to_sell = m * estimated_time_to_sell + b

    for plot_type in plot_types:
        if(plot_type == "boxplot"):
            axis.set_title('Boxplot (Zeit)')
            zoomed_axis.set_title('Boxplot (Preis)')
            axis.set_ylabel('Zeit (in Tagen)')
            zoomed_axis.set_ylabel('Preis (in Dollar)')

            axis.set_xlim(0, 2)
            axis.boxplot(np_delta)

            zoomed_axis.set_xlim(0, 2)
            zoomed_axis.boxplot(np_price)
        elif(plot_type == "scatterplot"):
            axis.set_title('Scatterplot (maximaler Zeitraum)')
            zoomed_axis.set_title('Scatterplot (30 Tage)')
            axis.set_xlabel('Zeit (in Tagen)')
            axis.set_ylabel('Preis (in Dollar)')
            zoomed_axis.set_xlabel('Zeit (in Tagen)')
            zoomed_axis.set_ylabel('Preis (in Dollar)')

            axis.scatter(np_delta, np_price, alpha=0.5)
            axis.plot(np_delta, m*np_delta + b, color="black")
            axis.scatter(estimated_time_to_sell, estimated_price_to_sell, marker='o',
                         color='r', label='point')
            zoomed_axis.set_xlim(0, 30)
            zoomed_axis.plot(np_delta, m*np_delta + b, color="black")
            zoomed_axis.scatter(np_delta, np_price, alpha=0.5)
            zoomed_axis.scatter(estimated_time_to_sell, estimated_price_to_sell,
                                marker='o', color='r', label='point')
        elif(plot_type == "regressionplot"):
            axis.set_title('Scatterplot (maximaler Zeitraum)')
            zoomed_axis.set_title('Scatterplot (30 Tage)')
            axis.set_xlabel('Zeit (in Tagen)')
            axis.set_ylabel('Preis (in Dollar)')
            zoomed_axis.set_xlabel('Zeit (in Tagen)')
            zoomed_axis.set_ylabel('Preis (in Dollar)')

            axis.plot(np_delta, m*np_delta + b, color="black")
            axis.scatter(estimated_time_to_sell, estimated_price_to_sell, marker='o',
                         color='r', label='point')
            zoomed_axis.set_xlim(0, 30)
            zoomed_axis.plot(np_delta, m*np_delta + b, color="black")
            zoomed_axis.scatter(estimated_time_to_sell, estimated_price_to_sell,
                                marker='o', color='r', label='point')
    return fig, zoomed_fig, estimated_time_to_sell, estimated_price_to_sell


def calculate_estimated_time_to_sell(np_delta):
    sumall = 0
    count = 0
    for delta in np_delta:
        sumall += delta
        count += 1
    return sumall / count


def __datetime(date_str):
    return dateutil.parser.parse(date_str)


if __name__ == '__main__':
    app.run()
