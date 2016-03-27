/*
 SortTable

 Instructions:
 Used from dokuwiki
 Click on the headers to sort

 Thanks to many, many people for contributions and suggestions.
 Currently licensed as X11:
 http://www.kryogenix.org/code/browser/licence.html

 v2.1 (7th April 2007)
 * originally by Stuart Langridge, http://www.kryogenix.org/code/browser/sorttable/

 v2.1b (19 Feb 2008)
 * first Otto Vainio (otto@valjakko.net) revision
 * Fixed some jslint errors to support DokuWiki (http://www.splitbrain.org) js compression
 * function reinitsort()
 * sorttable.reinit

 v2.2 (27.11.2008)
 * Changed line 77 document.getElementsByTagName('table') to div.getElementsByTagName('table')
 to allow multiple sortable tables in same page (Thanks to Hans Sampiemon)

 v2.3 (14.1.2009)
 * Added option for default sorting.
 * Use dokuwiki event registration.

 v2.4 (27.1.2009)
 * Cleaned some jlint errors to make this workable, when css+js compress is set in dokuwiki

 v2.5 (10.5.2011)
 * Fixed problems with secionediting, footnotes and edittable

 v2.6 (18.7.2013)
 * Added support for jQuery and dokuwiki Weatherwax ->

 v2.7 (28.5.2014)
 * Fixed problem with first row not getting sorted

 v2.8 (30.5.2014)
 * Fixed problem with first row not getting sorted in default sort. Added option "sumrow" to prevent sum line sort.

 v2.9 (13.8.2014)
 * Fixed problem with header row being sorted in earlier versions of dokuwiki. Added option for sorting back to default

 v2.11 (6.7.2015)
 * Added ip address sort. (Thanks Chefkeks)

 v2.12 (14.12.2015)
 * PHP 7 compatibility and issue #8. Default sort for columns > 9

 v2.13
 * revision by Vaxquis; fixes some (most) of the current issues
 */

//

var stIsIE = /*@cc_on!@*/false;
//var tableid = 0;

var sorttable = {
    reinit: function () {
        arguments.callee.done = true;
        // kill the timer
        //if (_timer) {clearInterval(_timer);}

        if ( !document.createElement || !document.getElementsByTagName ) {
            return;
        }

//    sorttable.DATE_RE = /^(\d\d?)[\/\.\-](\d\d?)[\/\.\-]((\d\d)?\d\d)$/;
        sorttable.DATE_RE = /^(\d\d?)[\/\.\-](\d\d?)[\/\.\-]((\d\d)?\d\d)((\d\d?)[:\.]?(\d\d?))?$/;

        var elems = document.getElementsByTagName( "table" );
        var elem;
        for( var i = 0; i < elems.length; i++ ) {
            elem = elems[i];
            if ( elem.className.search( /\bsortable\b/ ) !== -1 ) {
                sorttable.makeSortable( elem );
            }
        }
        elems = document.getElementsByTagName( "div" );
        for( var i = 0; i < elems.length; i++ ) {
            elem = elems[i];
            if ( elem.className.search( /\bsortable\b/ ) !== -1 ) {
                sorttable.makeSortableDiv( elem );
            }
        }
    },
    init: function () {
        if ( arguments.callee.done ) {
            return;
        }
        sorttable.reinit();
    },
    makeSortableDiv: function ( div ) {
        var childTables = div.getElementsByTagName( "table" );
        var elem;
        for( var i = 0; i < childTables.length; i++ ) {
            elem = childTables[i];
            var colid = div.className;
            var patt1 = /\bcol_\d_[a-z]+/gi;
            var overs = [];
            if ( colid.search( patt1 ) !== -1 ) {
                var overrides = colid.match( patt1 );
                for( var i = 0; i < overrides.length; i++ ) {
                    var entry = overrides[i];
                    if ( entry !== "" ) {
                        try {
                            var tmp = entry.split( "_" );
                            var ind = tmp[1];
                            var val = tmp[2];
                            overs[ind] = val;
                        } catch( e ) {
                        }
                    }
                }
                colid = colid.replace( patt1, '' );
            }
            var patt2 = /\bsortbottom_?\d?/gi;
            var bottoms = 0;
            if ( colid.search( patt2 ) !== -1 ) {
                var bs = colid.match( patt2 );
                try {
                    var tmp = bs[0].split( "_" );
                    //var ind = tmp[1];
                    var val = 1;
                    if ( tmp.length > 1 ) {
                        val = tmp[1];
                    }
                    bottoms = val;
                } catch( e ) {
                }
            }
            var patt2ph = /\bthreephase/gi;
            var ph2 = true;
            if ( colid.search( patt2ph ) !== -1 ) {
                ph2 = false;
            }

            sorttable.makeSortable( elem, overs, bottoms, ph2 );
            var pattdefault = /\bsortr?\d\d?/gi;
            if ( colid.search( pattdefault ) !== -1 ) {
                var mi = colid.match( pattdefault );
                colid = mi[0].replace( 'sort', '' );
                if ( colid !== '' ) {
                    colid = colid.trim();
                }
                var revs = false;
                if ( colid.search( /\br/ ) !== -1 ) {
                    revs = true;
                    colid = colid.replace( 'r', '' );
                }
                sorttable.defaultSort( elem, colid, revs );
            }
        }
    },
    defaultSort: function ( table, colid, revs ) {
//    theadrow = table.tHead.rows[0].cells;
        var havetHead = table.tHead;
        var sindex = 1;
        if ( havetHead ) {
            sindex = 0;
        }
        var theadrow = table.rows[0].cells;
        colid--;
        var colname = "col" + colid;
        // remove sorttable_sorted classes
        var thiscell = false;
        for( var i = 0; i < theadrow.length; i++ ) {
            var cell = theadrow[i];
            var colclass = cell.className;
            var classname = colclass.split( " " );
//       if (cell.className==colname)
            if ( classname[0] === colname ) {
                thiscell = cell;
            }
//       if (cell.nodeType == 1) { // an element
//         cell.className = cell.className.replace('sorttable_sorted_reverse','');
//         cell.className = cell.className.replace('sorttable_sorted','');
//       }
        }
        if ( thiscell === false ) {
            return;
        }
        var sortfwdind = document.getElementById( 'sorttable_sortfwdind' );
        if ( sortfwdind ) {
            sortfwdind.parentNode.removeChild( sortfwdind );
        }
        var sortrevind = document.getElementById( 'sorttable_sortrevind' );
        if ( sortrevind ) {
            sortrevind.parentNode.removeChild( sortrevind );
        }

        thiscell.className += ' sorttable_sorted';
        sortfwdind = document.createElement( 'span' );
        sortfwdind.id = "sorttable_sortfwdind";
        sortfwdind.innerHTML = stIsIE ? '&nbsp<font face="webdings">6</font>' : '&nbsp;&#x25BE;';
        thiscell.appendChild( sortfwdind );

        // build an array to sort. This is a Schwartzian transform thing,
        // i.e., we "decorate" each row with the actual sort key,
        // sort based on the sort keys, and then put the rows back in order
        // which is a lot faster because you only do getInnerText once per row
        var row_array = [];
        var col = thiscell.sorttable_columnindex;
        var rows = thiscell.sorttable_tbody.rows;
        for( var j = sindex; j < rows.length; j++ ) {
            row_array[row_array.length] = [sorttable.getInnerText( rows[j].cells[col] ), rows[j]];
        }
        /* If you want a stable sort, uncomment the following line */
        //sorttable.shaker_sort(row_array, this.sorttable_sortfunction);
        /* and comment out this one */
        row_array.sort( thiscell.sorttable_sortfunction );

        var tb = thiscell.sorttable_tbody;
        for( var jj = 0; jj < row_array.length; jj++ ) {
            tb.appendChild( row_array[jj][1] );
        }

        //delete row_array;
        // If reverse sort wanted, then doit
        if ( revs ) {
            // reverse the table, which is quicker
            sorttable.reverse( thiscell.sorttable_tbody, sindex );
            thiscell.className = thiscell.className.replace( 'sorttable_sorted',
                    'sorttable_sorted_reverse' );
            thiscell.removeChild( document.getElementById( 'sorttable_sortfwdind' ) );
            sortrevind = document.createElement( 'span' );
            sortrevind.id = "sorttable_sortrevind";
            sortrevind.innerHTML = stIsIE ? '&nbsp<font face="webdings">5</font>' : '&nbsp;&#x25B4;';
            thiscell.appendChild( sortrevind );
        }
    },
    makeSortable: function ( table, overrides, bottoms, ph2 ) {
//    tableid++;
        /*
         if (table.getElementsByTagName('thead').length === 0) {
         // table doesn't have a tHead. Since it should have, create one and
         // put the first table row in it.
         the = document.createElement('thead');
         the.appendChild(table.rows[0]);
         table.insertBefore(the,table.firstChild);
         }
         */
        // Safari doesn't support table.tHead, sigh
        /*
         if (table.tHead === null) {table.tHead = table.getElementsByTagName('thead')[0];}

         if (table.tHead.rows.length != 1) {return;} // can't cope with two header rows
         */
//    table.tHead.className += ' tableid'+tableid;

        // Sorttable v1 put rows with a class of "sortbottom" at the bottom (as
        // "total" rows, for example). This is B&R, since what you're supposed
        // to do is put them in a tfoot. So, if there are sortbottom rows,
        // for backwards compatibility, move them to tfoot (creating it if needed).

        var sortbottomrows = [];
        if ( bottoms > 0 ) {
            var frombottom = table.rows.length - bottoms;
            for( var i = table.rows.length - 1; i >= frombottom; i-- ) {
//      if (bottoms<frombottom) {
                sortbottomrows[sortbottomrows.length] = table.rows[i];
//      }
//      frombottom++;
            }
            if ( sortbottomrows ) {
                var tfo;
                if ( table.tFoot === null ) {
                    // table doesn't have a tfoot. Create one.
                    tfo = document.createElement( 'tfoot' );
                    table.appendChild( tfo );
                }
                for( var ii = sortbottomrows.length - 1; ii >= 0; ii-- ) {
                    tfo.appendChild( sortbottomrows[ii] );
                }
                //delete sortbottomrows;
            }
        }
        // work through each column and calculate its type
        var havetHead = table.tHead;
        var sindex = 1;
        if ( havetHead ) {
            sindex = 0;
        }
        var headrow = table.rows[0].cells;
//    for (var i=0; i<headrow.length; i++) {
        for( var i = 0; i < headrow.length; i++ ) {
            // manually override the type with a sorttable_type attribute
            var colOptions = "";
            if ( overrides[i + 1] )
            {
                colOptions = overrides[i + 1];
            }
            if ( !colOptions.match( /\bnosort\b/ ) ) { // skip this col
                var mtch = colOptions.match( /\b[a-z0-9]+\b/ );
                var override;
                if ( mtch ) {
                    override = mtch[0];
                }
                if ( mtch && typeof sorttable["sort_" + override] === 'function' ) {
                    headrow[i].sorttable_sortfunction = sorttable["sort_" + override];
                } else {
                    headrow[i].sorttable_sortfunction = sorttable.guessType( table, i );
                }
                /*
                 if (!headrow[i].className.match(/\bsorttable_nosort\b/)) { // skip this col
                 mtch = headrow[i].className.match(/\bsorttable_([a-z0-9]+)\b/);
                 if (mtch) { override = mtch[1]; }
                 if (mtch && typeof sorttable["sort_"+override] == 'function') {
                 headrow[i].sorttable_sortfunction = sorttable["sort_"+override];
                 } else {
                 headrow[i].sorttable_sortfunction = sorttable.guessType(table,i);
                 }
                 */
                // make it clickable to sort
                headrow[i].sorttable_columnindex = i;
                headrow[i].sorttable_tbody = table.tBodies[0];
                headrow[i].sindex = sindex;
//        dean_addEvent(headrow[i],"click", function(e) {
//        addEvent(headrow[i],"click", function(e) {
                jQuery( headrow[i] ).click( function () {

                    var theadrow = this.parentNode;
                    var sortrevind, sortfwdind;
                    if ( this.className.search( /\bsorttable_sorted\b/ ) !== -1 ) {
                        // if we're already sorted by this column, just
                        // reverse the table, which is quicker
                        sorttable.reverse( this.sorttable_tbody, this.sindex );
                        this.className = this.className.replace( 'sorttable_sorted',
                                'sorttable_sorted_reverse' );
                        sortfwdind = document.getElementById( 'sorttable_sortfwdind' );
                        if ( sortfwdind ) {
                            sortfwdind.parentNode.removeChild( sortfwdind );
                        }
//            this.removeChild(document.getElementById('sorttable_sortfwdind'));
                        sortrevind = document.getElementById( 'sorttable_sortrevind' );
                        if ( sortrevind ) {
                            sortrevind.parentNode.removeChild( sortrevind );
                        }
                        sortrevind = document.createElement( 'span' );
                        sortrevind.id = "sorttable_sortrevind";
                        sortrevind.innerHTML = stIsIE ? '&nbsp<font face="webdings">5</font>' : '&nbsp;&#x25B4;';
                        this.appendChild( sortrevind );
                        return;
                    }
                    if ( this.className.search( /\bsorttable_sorted_reverse\b/ ) !== -1 ) {
                        if ( !ph2 ) {
                            sorttable.original_order( this.sorttable_tbody, this.sindex );
                            var list = theadrow.childNodes;
                            for( var i = 0; i < list.length; i++ ) {
                                var cell = list[i];
                                if ( cell.nodeType === 1 ) { // an element
                                    cell.className = cell.className.replace( 'sorttable_sorted_reverse', '' );
                                    cell.className = cell.className.replace( 'sorttable_sorted', '' );
                                }
                            }
                            sortfwdind = document.getElementById( 'sorttable_sortfwdind' );
                            if ( sortfwdind ) {
                                sortfwdind.parentNode.removeChild( sortfwdind );
                            }
                            sortrevind = document.getElementById( 'sorttable_sortrevind' );
                            if ( sortrevind ) {
                                sortrevind.parentNode.removeChild( sortrevind );
                            }
                            return;
                        } else {
                            // if we're already sorted by this column in reverse, just
                            // re-reverse the table, which is quicker
                            sorttable.reverse( this.sorttable_tbody, this.sindex );
                            this.className = this.className.replace( 'sorttable_sorted_reverse',
                                    'sorttable_sorted' );
                            sortrevind = document.getElementById( 'sorttable_sortrevind' );
                            if ( sortrevind ) {
                                sortrevind.parentNode.removeChild( sortrevind );
                            }
                            //            this.removeChild(document.getElementById('sorttable_sortrevind'));
                            sortfwdind = document.getElementById( 'sorttable_sortfwdind' );
                            if ( sortfwdind ) {
                                sortfwdind.parentNode.removeChild( sortfwdind );
                            }
                            sortfwdind = document.createElement( 'span' );
                            sortfwdind.id = "sorttable_sortfwdind";
                            sortfwdind.innerHTML = stIsIE ? '&nbsp<font face="webdings">6</font>' : '&nbsp;&#x25BE;';
                            this.appendChild( sortfwdind );
                            return;
                        }
                    }

                    // remove sorttable_sorted classes
//          theadrow = this.parentNode;
                    var list = theadrow.childNodes;
                    for( var i = 0; i < list.length; i++ ) {
                        var cell = list[i];
                        if ( cell.nodeType === 1 ) { // an element
                            cell.className = cell.className.replace( 'sorttable_sorted_reverse', '' );
                            cell.className = cell.className.replace( 'sorttable_sorted', '' );
                        }
                    }
                    sortfwdind = document.getElementById( 'sorttable_sortfwdind' );
                    if ( sortfwdind ) {
                        sortfwdind.parentNode.removeChild( sortfwdind );
                    }
                    sortrevind = document.getElementById( 'sorttable_sortrevind' );
                    if ( sortrevind ) {
                        sortrevind.parentNode.removeChild( sortrevind );
                    }

                    this.className += ' sorttable_sorted';
                    sortfwdind = document.createElement( 'span' );
                    sortfwdind.id = "sorttable_sortfwdind";
                    sortfwdind.innerHTML = stIsIE ? '&nbsp<font face="webdings">6</font>' : '&nbsp;&#x25BE;';
                    this.appendChild( sortfwdind );

                    // build an array to sort. This is a Schwartzian transform thing,
                    // i.e., we "decorate" each row with the actual sort key,
                    // sort based on the sort keys, and then put the rows back in order
                    // which is a lot faster because you only do getInnerText once per row
                    var row_array = [];
                    var col = this.sorttable_columnindex;
                    var rows = this.sorttable_tbody.rows;
                    sindex = this.sindex;
                    for( var j = sindex; j < rows.length; j++ ) {
                        row_array[row_array.length] = [sorttable.getInnerText( rows[j].cells[col] ), rows[j]];
                    }
                    /* If you want a stable sort, uncomment the following line */
                    //sorttable.shaker_sort(row_array, this.sorttable_sortfunction);
                    /* and comment out this one */
                    row_array.sort( this.sorttable_sortfunction );

                    var tb = this.sorttable_tbody;
                    for( var j3 = 0; j3 < row_array.length; j3++ ) {
                        tb.appendChild( row_array[j3][1] );
                    }

                    //delete row_array;
                } );
            }
        }
    },
    guessType: function ( table, column ) {
        // guess the type of a column based on its first non-blank row
        var textCnt = 0;
        var numCnt = 0;
        var ddmmCnt = 0;
        var mmddCnt = 0;
        var ipCnt = 0;

        for( var i = 0; i < table.tBodies[0].rows.length; i++ ) {
            var text = sorttable.getInnerText( table.tBodies[0].rows[i].cells[column] );
            if ( text !== "" ) {
                if ( text.match( /^([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])$/ ) ) {  // now for ip-addresses
                    ipCnt++;
                } else if ( text.match( /^[\-\+]?[£$¤]?[\d,.]+[%€]?$/ ) ) {
                    numCnt++;
                } else {
                    // check for a date: dd/mm/yyyy or dd/mm/yy
                    // can have / or . or - as separator
                    // can be mm/dd as well
                    var possdate = text.match( sorttable.DATE_RE );
                    if ( possdate ) {
                        // looks like a date
                        var first = parseInt( possdate[1] );
                        var second = parseInt( possdate[2] );
                        if ( first > 12 ) {
                            // definitely dd/mm
                            ddmmCnt++;
                        } else if ( second > 12 ) {
                            mmddCnt++;
                        } else {
                            // looks like a date, but we can't tell which, so assume
                            // that it's dd/mm (English imperialism!) and keep looking
                            ddmmCnt++;
                        }
                    } else { // not a date (nor IP nor number)
                        textCnt++;
                    }
                }
            }
        }
        if ( textCnt > numCnt && textCnt > ipCnt && textCnt > ddmmCnt && textCnt > mmddCnt )
            return sorttable.sort_alpha;
        if ( numCnt > ipCnt && numCnt > ddmmCnt && numCnt > mmddCnt )
            return sorttable.sort_numeric;
        if ( ipCnt > ddmmCnt && ipCnt > mmddCnt )
            return sorttable.sort_ipaddr;
        return ( ddmmCnt > mmddCnt ) ? sorttable.sort_ddmm : sorttable.sort_mmdd;
    },
    getInnerText: function ( node ) {
        // gets the text we want to use for sorting for a cell.
        // strips leading and trailing whitespace.
        // this is *not* a generic getInnerText function; it's special to sorttable.
        // for example, you can override the cell text with a customkey attribute.
        // it also gets .value for <input> fields.
        if ( !node ) {
            return '';
        }
        var hasInputs = ( typeof node.getElementsByTagName === "function" ) &&
                node.getElementsByTagName( "input" ).length;
        if ( node.getAttribute( "sorttable_customkey" ) !== null ) {
            return node.getAttribute( "sorttable_customkey" );
        } else if ( typeof node.textContent !== "undefined" && !hasInputs ) {
            return node.textContent.replace( /^\s+|\s+$/g, '' );
        } else if ( typeof node.innerText !== "undefined" && !hasInputs ) {
            return node.innerText.replace( /^\s+|\s+$/g, '' );
        } else if ( typeof node.text !== "undefined" && !hasInputs ) {
            return node.text.replace( /^\s+|\s+$/g, '' );
        } else {
            switch ( node.nodeType ) {
                case 3:
                    return ( node.nodeName.toLowerCase() === "input" ) ? node.value.replace( /^\s+|\s+$/g, '' ) : '';
                case 4:
                    return node.nodeValue.replace( /^\s+|\s+$/g, '' );
                case 1:
                case 11:
                    var innerText = '';
                    for( var i = 0; i < node.childNodes.length; i++ ) {
                        innerText += sorttable.getInnerText( node.childNodes[i] );
                    }
                    return innerText.replace( /^\s+|\s+$/g, '' );
                default:
                    return '';
            }
        }
    },
    reverse: function ( tbody, sindex ) {
        // reverse the rows in a tbody
        var newrows = [];
        for( var i = sindex; i < tbody.rows.length; i++ ) {
            newrows[newrows.length] = tbody.rows[i];
        }
        for( var i = newrows.length - 1; i >= 0; i-- ) {
            tbody.appendChild( newrows[i] );
        }
        //delete newrows;
    },
    original_order: function ( tbody, isindex ) {
        // build an array to sort. This is a Schwartzian transform thing,
        // i.e., we "decorate" each row with the actual sort key,
        // sort based on the sort keys, and then put the rows back in order
        // which is a lot faster because you only do getInnerText once per row
        var row_array = [];
        var rows = tbody.rows;
        var sindex = isindex;
        for( var j = sindex; j < rows.length; j++ ) {
            row_array[row_array.length] = [rows[j].className, rows[j]];
        }
        /* If you want a stable sort, uncomment the following line */
        //sorttable.shaker_sort(row_array, this.sorttable_sortfunction);
        /* and comment out this one */
        row_array.sort( sorttable.sort_alpha );

        var tb = tbody;
        for( var j3 = 0; j3 < row_array.length; j3++ ) {
            tb.appendChild( row_array[j3][1] );
        }

        //delete row_array;
    },
    /* sort functions
     each sort function takes two parameters, a and b
     you are comparing a[0] and b[0] */
    sort_ipaddr: function ( a, b ) {
        var aa = a[0].split( ".", 4 );
        var bb = b[0].split( ".", 4 );
        var resulta = aa[0] * 0x1000000 + aa[1] * 0x10000 + aa[2] * 0x100 + aa[3] * 1;
        var resultb = bb[0] * 0x1000000 + bb[1] * 0x10000 + bb[2] * 0x100 + bb[3] * 1;
        return resulta - resultb;
    },
    sort_numeric: function ( a, b ) {
        if ( a[0] === "" ) {
            return -1;
        }
        if ( b[0] === "" ) {
            return 1;
        }
        var aa = parseFloat( a[0].replace( /[^0-9.\-]/g, '' ) );
        if ( isNaN( aa ) ) {
            aa = Number.NEGATIVE_INFINITY;
        }
        var bb = parseFloat( b[0].replace( /[^0-9.\-]/g, '' ) );
        if ( isNaN( bb ) ) {
            bb = Number.NEGATIVE_INFINITY;
        }
        return aa - bb;
    },
    sort_alpha: function ( a, b ) {
        return a[0].localeCompare( b[0] );
    },
    sort_ddmm: function ( a, b ) {
        var mtch = a[0].match( sorttable.DATE_RE );
        var y = mtch[3];
        var m = mtch[2];
        var d = mtch[1];
        var t = mtch[5] + '';
        if ( t.length < 1 ) {
            t = '';
        }
        if ( m.length === 1 ) {
            m = '0' + m;
        }
        if ( d.length === 1 ) {
            d = '0' + d;
        }
        var dt1 = y + m + d + t;
        mtch = b[0].match( sorttable.DATE_RE );
        y = mtch[3];
        m = mtch[2];
        d = mtch[1];
        t = mtch[5] + '';
        if ( t.length < 1 ) {
            t = '';
        }
        if ( m.length === 1 ) {
            m = '0' + m;
        }
        if ( d.length === 1 ) {
            d = '0' + d;
        }
        var dt2 = y + m + d + t;
        if ( dt1 === dt2 ) {
            return 0;
        }
        if ( dt1 < dt2 ) {
            return -1;
        }
        return 1;
    },
    sort_mmdd: function ( a, b ) {
        var mtch = a[0].match( sorttable.DATE_RE );
        var y = mtch[3];
        var d = mtch[2];
        var m = mtch[1];
        var t = mtch[5] + '';
        if ( m.length === 1 ) {
            m = '0' + m;
        }
        if ( d.length === 1 ) {
            d = '0' + d;
        }
        var dt1 = y + m + d + t;
        mtch = b[0].match( sorttable.DATE_RE );
        y = mtch[3];
        d = mtch[2];
        m = mtch[1];
        t = mtch[5] + '';
        if ( t.length < 1 ) {
            t = '';
        }
        if ( m.length === 1 ) {
            m = '0' + m;
        }
        if ( d.length === 1 ) {
            d = '0' + d;
        }
        var dt2 = y + m + d + t;
        if ( dt1 === dt2 ) {
            return 0;
        }
        if ( dt1 < dt2 ) {
            return -1;
        }
        return 1;
    },
    shaker_sort: function ( list, comp_func ) {
        // A stable sort function to allow multi-level sorting of data
        // see: http://en.wikipedia.org/wiki/Cocktail_sort
        // thanks to Joseph Nahmias
        var b = 0;
        var t = list.length - 1;
        var swap = true;
        var q;

        while( swap ) {
            swap = false;
            for( var i = b; i < t; ++i ) {
                if ( comp_func( list[i], list[i + 1] ) > 0 ) {
                    q = list[i];
                    list[i] = list[i + 1];
                    list[i + 1] = q;
                    swap = true;
                }
            } // for
            t--;

            if ( !swap ) {
                break;
            }

            for( var i = t; i > b; --i ) {
                if ( comp_func( list[i], list[i - 1] ) < 0 ) {
                    q = list[i];
                    list[i] = list[i - 1];
                    list[i - 1] = q;
                    swap = true;
                }
            } // for
            b++;

        } // while(swap)
    }


};

if ( typeof ( window.addEvent ) !== "undefined" ) {
    window.addEvent( window, "load", sorttable.init );
} else {
    jQuery( function () {
        sorttable.init();
    } );
}
