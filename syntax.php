<?php
/**
 Based on code from http://www.kryogenix.org/code/browser/sorttable/ by Stuart Langridge
 (distributed under the conditions of MIT licence from http://www.kryogenix.org/code/browser/licence.html).
 Includes open-source contributions from other people
 (see https://github.com/FyiurAmron/sortablejs/graphs/contributors for more details).
 Maintainers:
 2007-2016 oiv (Otto Vainio at otto@valjakko.net)
 2016-? vaxquis AKA FyiurAmron (spamove@gmail.com)
 */

// must be run within Dokuwiki
if ( !defined( 'DOKU_INC' ) )
    die();
if ( !defined( 'DOKU_PLUGIN' ) )
    define( 'DOKU_PLUGIN', DOKU_INC.'lib/plugins/' );
require_once(DOKU_PLUGIN.'syntax.php');
//
class syntax_plugin_sortablejs extends DokuWiki_Syntax_Plugin {

    function getType() {
        return 'container';
    }

    function getPType() {
        return 'block';
    }

    function getSort() {
        return 371;
    }

    function getAllowedTypes() {
        return array( 'container', 'formatting', 'substition' );
    }

    function connectTo( $mode ) {
        $this->Lexer->addEntryPattern( '<sortable[^>]*>(?=.*?</sortable>)', $mode, 'plugin_sortablejs' );
    }

    function postConnect() {
        $this->Lexer->addExitPattern( '</sortable>', 'plugin_sortablejs' );
    }

    function handle( $match, $state, $pos, Doku_Handler $handler ) {

        switch ( $state ) {
            case DOKU_LEXER_ENTER :
                $match = substr( $match, 9, -1 );
                $match = trim( $match );
                $scl = "";
                if ( strlen( $match ) > 0 ) {
                    $scl = $this->__validateOptions( $match );
                }
                return array( $state, $scl );
            case DOKU_LEXER_UNMATCHED :
                return array( $state, $match );
            case DOKU_LEXER_EXIT :
                return array( $state, "" );
        }
        return array();
    }

    function render( $mode, Doku_Renderer $renderer, $data ) {
        list($state, $match) = $data;
        if ( $mode == 'xhtml' ) {
            switch ( $state ) {
                case DOKU_LEXER_ENTER :
                    $renderer->doc .= "<div class=\"sortable$match\">";
                    break;
                case DOKU_LEXER_UNMATCHED :
                    $instructions = p_get_instructions( $match );
                    foreach( $instructions as $instruction ) {
                        call_user_func_array( array( &$renderer, $instruction[0] ), $instruction[1] );
                    }

                    break;
                case DOKU_LEXER_EXIT :
                    $renderer->doc .= "</div>";
                    break;
            }
            return true;
        } else if ( $mode == 'odt' ) {
            switch ( $state ) {
                case DOKU_LEXER_ENTER :
                    // In ODT, tables must not be inside a paragraph. Make sure we
                    // closed any opened paragraph
                    $renderer->p_close();
                    break;
                case DOKU_LEXER_UNMATCHED :
                    $instructions = array_slice( p_get_instructions( $match ), 1, -1 );
                    foreach( $instructions as $instruction ) {
                        call_user_func_array( array( &$renderer, $instruction[0] ), $instruction[1] );
                    }
                    break;
                case DOKU_LEXER_EXIT :
                    //$renderer->p_open();
                    // DO NOT re-open the paragraph, it would cause an error if the table is the last content on a page
                    break;
            }
            return true;
        }
        return false;
    }

    function __validateOptions( $opts ) {
        $oa = explode( " ", $opts );
        $ret = "";
        foreach( $oa as $opt ) {
            list($c, $v) = explode( "=", $opt );
            if ( $c == "sumrow" ) {
                $c = $v;
                $v = "sumrow";
                if ( $c == "" ) {
                    $c = "1";
                }
            } else if ( $c == "3phase" ) {
                $v = $c;
                $c = "";
            }
            if ( $v != null ) {
                $cmpr = $v;
            } else {
                if ( preg_match( '/r?\d*/', $c, $matches ) ) {
                    $cmpr = 'sort';
                }
            }
            switch ( $cmpr ) {
                case '3phase':
                    $ret .= " threephase";
                    break;
                case 'nosort':
                    $ret .= " col_".$c."_nosort";
                    break;
                case 'numeric':
                    $ret .= " col_".$c."_numeric";
                    break;
                case 'date':
                    $ret .= " col_".$c."_date";
                    break;
                case 'alpha':
                case 'text':
                    $ret .= " col_".$c."_alpha";
                    break;
                case 'sort':
                    $ret .= ' sort'.$opt;
                    break;
                case 'sumrow':
                    $ret .= ' sortbottom_'.$c;
                    break;
            }
        }
        return $ret;
    }
}
