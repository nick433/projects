import java.io.*;
import java.util.*;

/******************************************************************************
 *  Compilation:  javac StockQuote.java
 *  Execution:    java StockQuote symbol
 *  Dependencies: In.java, StdOut.java
 *
 *  Print the stock price of the stock with the given symbol. Screen scrapes
 *  http://finance.yahoo.com to get the current price and
 *  associated information.
 *
 *  % java StockQuote goog
 *  710.81
 *  Alphabet Inc.
 *  Mon, Nov 2, 2015, 9:29AM EST 
 *
 *  % java StockQuote aapl
 *  119.86
 *  Apple Inc.
 *  Mon, Nov 2, 2015, 9:30AM EST
 * 
 *  % java StockQuote ibm
 *  140.32
 *  International Business Machines
 *  Mon, Nov 2, 2015, 9:30AM EST 
 *
 *  % java StockQuote msft
 *  52.73
 *  Microsoft Corporation
 *  Mon, Nov 2, 2015, 9:30AM EST 
 *
 ******************************************************************************/

public class StockQuote {

    // Given symbol, get HTML
    private static String readHTML(String symbol) {
        In page = new In("http://finance.yahoo.com/q?s=" + symbol);
        String html = page.readAll();
        return html;
    }

    // Given symbol, get current stock price.
    public static double priceOf(String symbol) {
        String html = readHTML(symbol);
        int p     = html.indexOf("yfs_l84", 0);      // "yfs_l84" index
        int from  = html.indexOf(">", p);            // ">" index
        int to    = html.indexOf("</span>", from);   // "</span>" index
        String price = html.substring(from + 1, to);
        return Double.parseDouble(price.replaceAll(",", ""));
    }

    // Given symbol, get current stock name.
    public static String nameOf(String symbol) {
        String html = readHTML(symbol);
        int p    = html.indexOf("<title>", 0);
        int from = html.indexOf("Summary for ", p);
        int to   = html.indexOf("- Yahoo! Finance", from);
        String name = html.substring(from + 12, to);
        return name;
    }

    // Given symbol, get current date.
    public static String dateOf(String symbol) {
        String html = readHTML(symbol);
        int p    = html.indexOf("<span id=\"yfs_market_time\">", 0);
        int from = html.indexOf(">", p);
        int to   = html.indexOf("-", from);        // no closing small tag
        String date = html.substring(from + 1, to);
        return date;
    }

}
