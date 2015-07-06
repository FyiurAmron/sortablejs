<?php
/**
 * Sortablejs: Javascript for Sortable table
 *
 * @license    GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * @author     Otto Vainio
 * version 1.1 Fixed javascript error in sorttable js
 * version 2.0 Added <div> to sort any table
 * version 2.1 Changed script to allow multiple sortable tables in one page
 * version 2.2 A table can now be sorted by one column by default.
 * version 2.2a css+js compress broke this script. Now fixed some jslint complains.
 * version 2.3 Added support for odt plugin. (Aurélien Bompard)
 * version 2.3a Fixed default sort with aligned text (Andre Rauschenbach)
 * version 2.4 Added options to set manual override options for column sort. (nosort, numeric, alpha, ddmm, mmdd)
 * version 2.5 Fixed problems with secionediting, footnotes and edittable
 * version 2.6 Added support for jQuery and dokuwiki Weatherwax ->
 * version 2.7 Fixed problem with first row not getting sorted
 * version 2.8 Fixed problem with first row not getting sorted in default sort. Added option "sumrow" to prevent sum line sort. 
 * version 2.9 fixed problem with header row being sorted in earlier versions of dokuwiki.
 * version 2.10 fixed odt export (LarsGit223)
 * version 2.11 Added ip address sort. Thanks Chefkeks
 */
// must be run within Dokuwiki
if (!defined('DOKU_INC')) die();
if (!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN', DOKU_INC.'lib/plugins/');
require_once(DOKU_PLUGIN.'syntax.php');

class syntax_plugin_sortablejs extends DokuWiki_Syntax_Plugin {


  function getType() { return 'container';}
  function getPType(){ return 'block';}
  function getSort() { return 371; }
  function getAllowedTypes() {return array('container','formatting','substition');}
	function connectTo($mode) {
    $this->Lexer->addEntryPattern('<sortable[^>]*>(?=.*?</sortable>)',$mode,'plugin_sortablejs');
//    $this->Lexer->addEntryPattern('\x3Csortable.*?\x3E',$mode,'plugin_sortablejs');
//    $this->Lexer->addEntryPattern('<sortable>',$mode,'plugin_sortablejs');
  }
  function postConnect() {
    $this->Lexer->addExitPattern('</sortable>','plugin_sortablejs');
  }
  function handle($match, $state, $pos, &$handler){
    
    switch ($state) {
      case DOKU_LEXER_ENTER :
        $match = substr($match,9,-1);
        $match=trim($match);
        $scl="";
        if (strlen($match)>0) {
          $scl=$this->__validateOptions($match);
        }
        return array($state, $scl);
        break;
      case DOKU_LEXER_UNMATCHED :
//        return p_render('xhtml',p_get_instructions($match),$info);
        return array($state, $match);
        break;
      case DOKU_LEXER_EXIT :
//        return "</div>";
        return array($state, "");
        break;
    }
    return array();
  }

  function render($mode, &$renderer, $data) {
    list($state,$match) = $data;
    if ($mode == 'xhtml'){
      switch ($state) {
        case DOKU_LEXER_ENTER :
          $renderer->doc .= "<div class=\"sortable$match\">";
          break;
        case DOKU_LEXER_UNMATCHED :
//          $dbgr = p_render('xhtml',p_get_instructions($match),$info);
//          $renderer->doc .= p_render('xhtml',p_get_instructions($match),$info);
//          $renderer->doc .= $match;
//          $instructions = array_slice(p_get_instructions($match), 1, -1);
          $instructions = p_get_instructions($match);
          foreach ($instructions as $instruction) {
            call_user_func_array(array(&$renderer, $instruction[0]),$instruction[1]);
          }

          break;
        case DOKU_LEXER_EXIT :
          $renderer->doc .=  "</div>";
          break;
      }
      return true;
    } else if($mode == 'odt'){
      switch ($state) {
        case DOKU_LEXER_ENTER :
          // In ODT, tables must not be inside a paragraph. Make sure we
          // closed any opened paragraph
          $renderer->p_close();
          break;
        case DOKU_LEXER_UNMATCHED :
          $instructions = array_slice(p_get_instructions($match), 1, -1);
          foreach ($instructions as $instruction) {
            call_user_func_array(array(&$renderer, $instruction[0]),$instruction[1]);
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

  function __validateOptions($opts) {
    $oa = split(" ", $opts);
    $ret = "";
    foreach($oa as $opt) {
      list($c,$v) = split("=",$opt);
      if ($c=="sumrow") {
        $c=$v;
        $v="sumrow";
        if ($c=="") {
          $c="1";
        }
      } else if ($c=="3phase") {
        $v=$c;
        $c="";
      }
      if ($v!=null) {
        $cmpr=$v;
      } else {
        if (preg_match('/r?\d*/', $c, $matches)) {
          $cmpr='sort';
        }
      }
      switch ($cmpr) {
        case '3phase':
            $ret .= " threephase";
            break;
        case 'nosort':
            $ret .= " col_" . $c . "_nosort";
            break;
        case 'numeric':
            $ret .= " col_" . $c . "_numeric";
            break;
        case 'ddmm':
            $ret .= " col_" . $c . "_ddmm";
            break;
        case 'mmdd':
            $ret .= " col_" . $c . "_mmdd";
            break;
        case 'alpha':
        case 'text':
            $ret .= " col_" . $c . "_alpha";
            break;
        case 'sort':
            $ret .= ' sort' . $opt;
            break;
        case 'sumrow':
            $ret .= ' sortbottom_' . $c;
            //$ret = ' sortbottom' . $ret;
            break;
      }
    }
    return $ret;
  }

}
?>
