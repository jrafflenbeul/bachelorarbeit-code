import asyncio
import json
import typing
import pyppeteer

import scraper.scraper as scraper


async def alist(iterable):
    for i in iterable:
        yield(i)


async def search(query: str, get_all_pages: bool = False, limit: int = None) -> typing.List:
    browser = await pyppeteer.launch(headless=True)
    context = await browser.createIncognitoBrowserContext()

    print("Start fetching completed listings...")
    s = await scraper.Scraper().find_completed_items_ids(context, query)
    print("Successfully fetched completed listings.")

    #items = s.items
    page_count = s.pages

    items = dict()

    print('pg\tpages')

    if get_all_pages:
        if len(page_count) > 1:
            async for pn in alist(page_count):
                asyncio.sleep(1)
                page_items = await scraper.Scraper().find_completed_items_ids(context, query, from_page=pn)

                print(
                    f'{pn}\t{page_count}\tgot: {len(page_items.items[pn])} listings')

                items.update(page_items.items)

                # data_json = json.dumps(items)
                # f = open(f'items_{pn}.json', "w")
                # f.write(data_json)
                # f.close()

    data_json = json.dumps(items)
    f = open(f'{query}_items.json', "w")
    f.write(data_json)
    f.close()

    return s.items


def main():
    asyncio.run(search('macbook pro 2017', True, 1))
    print("Finished writing items to JSON")


main()
