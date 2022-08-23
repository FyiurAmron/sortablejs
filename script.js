/**
 Based on code from http://www.kryogenix.org/code/browser/sorttable/ by Stuart Langridge
 (distributed under the conditions of MIT licence from http://www.kryogenix.org/code/browser/licence.html).
 Includes open-source contributions from other people
 (see https://github.com/FyiurAmron/sortablejs/graphs/contributors for more details).
 Maintainers:
 2007-2016 oiv (Otto Vainio at otto@valjakko.net)
 2016-? vaxquis AKA FyiurAmron (spamove@gmail.com)
 */

var stIsIE = /*@cc_on!@*/false;
//var tableid = 0;

var sorttable = {
    reinit: function () {
        arguments.callee.done = true;

        if ( !document.createElement || !document.getElementsByTagName ) {
            return;
        }

        var elems = document.getElementsByTagName( "table" );
        var elem;
        for( var i = 0; i < elems.length; i++ ) {
            elem = elems[i];
            if ( jQuery(elem).hasClass("sortable") ) {
                sorttable.makeSortable( elem );
            }
        }
        elems = document.getElementsByTagName( "div" );
        for( var i = 0; i < elems.length; i++ ) {
            elem = elems[i];
            if ( jQuery(elem).hasClass("sortable") ) {
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
            if ( classname[0] === colname ) {
                thiscell = cell;
            }
        }
        if ( thiscell === false ) {
            return;
        }
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

        if ( revs ) {
            sorttable.reverse( thiscell.sorttable_tbody, sindex );
            jQuery(thiscell).addClass( "sorttable_sorted_reverse" );
        } else {
            jQuery(thiscell).addClass( "sorttable_sorted" );
        }
    },
    makeSortable: function ( table, overrides, bottoms, ph2 ) {
        // Sorttable v1 put rows with a class of "sortbottom" at the bottom (as
        // "total" rows, for example). This is B&R, since what you're supposed
        // to do is put them in a tfoot. So, if there are sortbottom rows,
        // for backwards compatibility, move them to tfoot (creating it if needed).

        var sortbottomrows = [];
        if ( bottoms > 0 ) {
            var frombottom = table.rows.length - bottoms;
            for( var i = table.rows.length - 1; i >= frombottom; i-- ) {
                sortbottomrows[sortbottomrows.length] = table.rows[i];
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

        for( var i = 0; i < headrow.length; i++ ) {
            // manually override the type with a sorttable_type attribute
            var colOptions = "";
            if ( overrides[i + 1] )
            {
                colOptions = overrides[i + 1];
            }
            if ( colOptions.match( /\bnosort\b/ ) ) {
                jQuery(headrow[i]).addClass("sorttable_nosort");
            } else { // skip this col
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

             // make it clickable to sort
                headrow[i].sorttable_columnindex = i;
                headrow[i].sorttable_tbody = table.tBodies[0];
                headrow[i].sindex = sindex;

                jQuery( headrow[i] ).click( function () {
                    var theadrow = this.parentNode;
                    var jqt = jQuery( this );
                    if ( jqt.hasClass( "sorttable_sorted" ) ) {
                        // if we're already sorted by this column, just reverse the table
                        sorttable.reverse( this.sorttable_tbody, this.sindex );
                        jqt.removeClass( "sorttable_sorted" );
                        jqt.addClass( "sorttable_sorted_reverse" );
                        return;
                    }
                    if ( jqt.hasClass( "sorttable_sorted_reverse" ) ) {
                        if ( !ph2 ) {
                            sorttable.original_order( this.sorttable_tbody, this.sindex );
                            var list = theadrow.childNodes;
                            for( var i = 0; i < list.length; i++ ) {
                                var cell = list[i];
                                if ( cell.nodeType === 1 ) { // an element
                                    var cc = jQuery( cell );
                                    cc.removeClass( "sorttable_sorted" );
                                    cc.removeClass( "sorttable_sorted_reverse" );
                                }
                            }
                            return;
                        } else {
                            // if we're already sorted by this column in reverse, just re-reverse the table
                            sorttable.reverse( this.sorttable_tbody, this.sindex );
                            jqt.removeClass( "sorttable_sorted_reverse" );
                            jqt.addClass( "sorttable_sorted" );
                            return;
                        }
                    }

                    // remove sorttable_sorted classes
                    var list = theadrow.childNodes;
                    for( var i = 0; i < list.length; i++ ) {
                        var cell = list[i];
                        if ( cell.nodeType === 1 ) { // an element
                            var cc = jQuery( cell );
                            cc.removeClass( "sorttable_sorted" );
                            cc.removeClass( "sorttable_sorted_reverse" );
                        }
                    }
                    jqt.addClass( "sorttable_sorted" );

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
        var dateCnt = 0;
        var ipCnt = 0;

        for( var i = 0; i < table.tBodies[0].rows.length; i++ ) {
            var text = sorttable.getInnerText( table.tBodies[0].rows[i].cells[column] );
            if ( text !== "" ) {
                if ( text.match( /^([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])\.([01]?\d\d?|2[0-4]\d|25[0-5])$/ ) ) {
                    ipCnt++;
                } else if ( text.match( /^[\-\+]?.?\d*[\d,.]?\d+.?$/ ) ) {
                    numCnt++;
                } else if ( !isNaN( new Date( text ).getTime() ) ) {
                    dateCnt++;
                } else { // not a date (nor IP nor number)
                    textCnt++;
                }
            }
        }
        if ( textCnt > numCnt && textCnt > ipCnt && textCnt > dateCnt )
            return sorttable.sort_alpha;
        if ( numCnt > ipCnt && numCnt > dateCnt )
            return sorttable.sort_numeric;
        if ( ipCnt > dateCnt )
            return sorttable.sort_ipaddr;
        return sorttable.sort_date;
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
        var aa = parseFloat( a[0].replace( ",", "." ).replace( /[^0-9.\-]/g, "" ) );
        if ( isNaN( aa ) ) {
            aa = Number.NEGATIVE_INFINITY;
        }
        var bb = parseFloat( b[0].replace( ",", "." ).replace( /[^0-9.\-]/g, "" ) );
        if ( isNaN( bb ) ) {
            bb = Number.NEGATIVE_INFINITY;
        }
        return aa - bb;
    },
    sort_alpha: function ( a, b ) {
        return a[0].localeCompare( b[0] );
    },
    sort_date: function ( a, b ) {
        var aa = new Date( a[0] ), bb = new Date( b[0] );
        return ( aa > bb ) - ( aa < bb );
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
