import typing
from element.element import Element
from itertools import islice


class Scraper:
    query: str = None
    items: typing.Dict = None
    pages: int = 1

    @classmethod
    async def find_completed_items_ids(cls, context, query: str, from_page: int = 1):
        self = Scraper()

        page = await context.newPage()
        page.setDefaultNavigationTimeout(0)
        await page.goto(f'https://www.ebay.com/sch/i.html?_from=R40&_nkw={query}&_sacat=0&rt=nc&LH_Sold=1&LH_Complete=1&_pgn={from_page}&_ipg=200')
        await page.screenshot({'path': "image.png"})
        page_results = await page.evaluate('''
            () => {
                let results = [];
                let pagesContainer = document.querySelector(".pagination__items");
                const items = document.querySelectorAll(".s-item__link");
                for(var i = 0; i < items.length; i++) {
                    let link = "";
                    try {
                        link = items[i].href;
                    } catch(err){}
                    let id = "";

                    if(link) {
                        const splittedLink = link.split("/");
                        const lastLinkElement = splittedLink[splittedLink.length - 1];
                        const splittedLinkElement = lastLinkElement.split("?");
                        id = splittedLinkElement[0];
                    }

                    if(id) {
                        results.push({
                            id: id,
                        })
                    }
                }
                
                pages = [];
                if (pagesContainer) {
                    pagesContainer.childNodes.forEach((li) => {
                        pages.push(parseInt(li.textContent))
                    });
                } else {
                    pages = [1];
                }
                return {
                    items: results,
                    pages: pages
                };
            }
        ''')

        for item in page_results['items']:
            for k, v in item.items():
                e = Element(v, kill_tags=['span']) if item[k] else None
                if e:
                    item[k] = e.text()
        self.items = {from_page: page_results['items']}
        self.pages = page_results['pages']

        await page.close()

        return self

    @classmethod
    async def find_completed_items(cls, context, query: str, from_page: int = 1):
        self = Scraper()

        page = await context.newPage()
        page.setDefaultNavigationTimeout(0)
        await page.goto(f'https://www.ebay.com/sch/i.html?_from=R40&_nkw={query}&_sacat=0&rt=nc&LH_Sold=1&LH_Complete=1&_pgn={from_page}&_ipg=200')

        page_results = await page.evaluate('''
            () => {
                let results = [];
                let pagesContainer = document.querySelector(".pagination__items");
                document.querySelectorAll(".s-item__wrapper ").forEach((item) => {
                    let title = item.querySelector("h3").outerHTML;
                    let date = item.querySelector(".s-item__title--tagblock").outerHTML;
                    let url = item.querySelector("h3").parentNode.getAttribute("href").outerHTML;
                    let image = item.querySelector("img").getAttribute("src").outerHTML;
                    let price = item.querySelector(".s-item__price").outerHTML;
                    let sold = item.querySelector(".s-item__endedDate").outerHTML;
                    let bids = item.querySelector(".s-item__bidCount");
                    let shipping = item.querySelector(".s-item__logisticsCost");
                    let link = item.querySelector(".s-item__link").href;
                    let id = "";
                    if (bids) { bids = bids.outerHTML; }
                    if (shipping) { shipping = shipping.outerHTML; }
                    if(link) {
                        const splittedLink = link.split("/");
                        const lastLinkElement = splittedLink[splittedLink.length - 1];
                        const splittedLinkElement = lastLinkElement.split("?");
                        id = splittedLinkElement[0];
                    }

                    let isAuction = true;

                    if(item.querySelector(".s-item__purchase-options-with-icon")) {
                        let buy_it_now_span = item.querySelector(".s-item__purchase-options-with-icon").textContent;
                        if(buy_it_now_span === "Buy It Now" || buy_it_now_span === "or Best Offer") {
                            isAuction = false;
                        }
                    }

                    results.push({
                        title: title,
                        date: date,
                        url: url,
                        image: image,
                        price: price,
                        sold: sold,
                        bids: bids,
                        shipping: shipping,
                        link: link,
                        id: id,
                        auction: isAuction
                    })
                });
                pages = [];
                if (pagesContainer) {
                    pagesContainer.childNodes.forEach((li) => {
                        pages.push(parseInt(li.textContent))
                    });
                } else {
                    pages = [1];
                }
                return {
                    items: results,
                    pages: pages
                };
            }
        ''')

        for item in page_results['items']:
            for k, v in item.items():
                if k in ['auction']:
                    continue
                e = Element(v, kill_tags=['span']) if item[k] else None
                if e:
                    if k in ['image']:
                        item[k] = e.get('src')
                        continue
                    if k in ['title']:
                        e.clean()
                    item[k] = e.text()

        for item in page_results['items']:
            print(item['id'])
            array = await Scraper.get_url_of_bid_page(context, item['id'], item['auction'], page)
            if(array and array['link'] != "no-link"):
                if(array['type'] == 'bid' and array['link'] != ""):
                    first_bid_date = await Scraper.get_date_of_first_bid(context, array['link'], page)
                    item['startdate'] = first_bid_date
                elif(array['type'] == 'revision'):
                    first_revision_date = await Scraper.get_date_of_first_revision(context, array['link'], page)
                    item['startdate'] = first_revision_date
            elif(not array):
                print(
                    "No link to bids or revisions found! This may mean, that the ad is not completed yet or has no revisions.")

        self.items = {from_page: page_results['items']}
        self.pages = page_results['pages']

        await page.close()

        return self

    @classmethod
    async def get_url_of_completed_item(cls, context, id: str, page):
        await page.goto(f'https://ebay.com/itm/{id}')

        url_of_bid_page = await page.evaluate('''
            () => {
                const view_more = document.querySelector(".nodestar-item-card-details__table-row2 .nodestar-item-card-details__view-link-wrapper.nodestar-item-card-details__view-link-wrapper .nodestar-item-card-details__view .nodestar-item-card-details__view-link");
                
                if(view_more) {
                    if(view_more.textContent === "View original item") {
                        return view_more.href
                    }
                }
                return null;
            }
        ''')
        return url_of_bid_page

    @classmethod
    async def get_url_of_bid_page(cls, context, id: str, is_auction: bool, page):
        await page.goto(f'https://ebay.com/itm/{id}?orig_cvip=true')

        is_new_ad_screen = await page.evaluate('''
            () => {
                const view_more_button = document.querySelector(".nodestar-item-card-details__table-row2 .nodestar-item-card-details__view-link-wrapper.nodestar-item-card-details__view-link-wrapper .nodestar-item-card-details__view .nodestar-item-card-details__view-link");
                if(view_more_button) {
                    return true;
                } else {
                    return false;
                }
            }
        ''')

        print("Is auction: ", is_auction)
        print("New screen: ", is_new_ad_screen)

        is_completed = await page.evaluate('''
            () => {
                if(document.querySelector("#qtySubTxt")) {
                    return false;
                } else {
                    return true;
                }
            }
        ''')

        print("Is completed: ", is_completed)

        if(is_completed):
            if(is_auction):
                if(is_new_ad_screen):
                    url_of_completed_item = await Scraper.get_url_of_completed_item(context, id, page)
                    await page.goto(url_of_completed_item)

                bid_link = await page.evaluate('''
                    () => {
                        const bid_link = document.querySelector("#vi-VR-bid-lnk");
                        
                        if(bid_link) {
                            return bid_link.href;
                        } else  {
                            return "";
                        }
                    }
                ''')
                return {"link": bid_link, "type": "bid"}
            else:
                revision_link = await page.evaluate('''
                    () => {
                        if(document.querySelector(".vi-desc-revHistory div span")) {
                            const revision_info_spans = document.querySelectorAll(".vi-desc-revHistory div span");
                            revision_link_span = revision_info_spans[revision_info_spans.length - 1];
                            revision_link = revision_link_span.querySelector("a").href;
                            return revision_link;
                        } else {
                            return "no-link";
                        }
                    }
                ''')
                return {"link": revision_link, "type": "revision"}

        else:
            pass

    @classmethod
    async def get_date_of_first_bid(cls, context, bid_url, page):
        await page.goto(bid_url)

        first_bid_date = await page.evaluate('''
            () => {
                const bid_detail_infos = document.querySelectorAll(".ui-component-table_tr_detailinfo");
                last_bid_detail_info = bid_detail_infos[bid_detail_infos.length - 1];
                bid_detail_elements = last_bid_detail_info.querySelectorAll("td");
                starting_date_element = bid_detail_elements[bid_detail_elements.length - 1];
                starting_date_span_wrapper = starting_date_element.querySelector(".ui-inline-map-wrapper");
                starting_date = starting_date_span_wrapper.querySelector("span span span").textContent

                return starting_date;
            }
        ''')
        print("First bid date: ", first_bid_date)
        return first_bid_date

    @classmethod
    async def get_date_of_first_revision(cls, context, revision_url, page):
        await page.goto(revision_url)

        first_revision_date = await page.evaluate('''
            () => {
                if(document.querySelector(".nodestar-revision-history__subtitle span span").textContent === "The following revisions have been made:") {
                    const revision_table = document.querySelectorAll(".nodestar-revision-history__table .vi-tableClass tbody tr");
                    const first_revision_row = revision_table[1];
                    const date_span = first_revision_row.querySelector(".vi-columnClass div span span");

                    return date_span.textContent;
                } else {
                    return "No revision date found";
                }
            }
        ''')

        print("First revision date: ", first_revision_date)
        return first_revision_date
