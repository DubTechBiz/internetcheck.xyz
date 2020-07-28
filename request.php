<?php

require_once './src/BasicFunctions/basicfunctions.php';

// Define some needed data for easier use
define("HONEYPOT_RUNNING", true);
define("CLIENT_IP", getIP());
define("SUBDOMAIN", implode('.', array_slice(explode('.', $_SERVER['SERVER_NAME']), 0, -2)));

// $req = array_key_exists('req', $_GET) ? $_GET['req'] : 'index.html';
$req = substr($_SERVER['SCRIPT_URL'], 1) or false;

/*
 * networkcheck.xyz currently has a bad reputation,
 * due to hosting lnkr5.min.js adware. This block of
 * code will exist until the reputation is clear.
 * We may even go to basic HTML/static content and
 * run without any PHP afterwards.
 */
if(HONEYPOT_RUNNING)
{
	// Log the URL requested (honeypot mode, until domain reputation is cleaned)
	if(true)
	{
	    $l = fopen('request.log', 'a');
	    fwrite($l, '['.str_pad(str_pad(microtime(true), 15), 16, ' ', STR_PAD_LEFT).'|'.str_pad(CLIENT_IP, 15).'|'.$_SERVER['SCRIPT_URI'].'] '.json_encode($_SERVER).PHP_EOL);
	    fclose($l);
	}

	// Phone-Home calls should just end here
	if(SUBDOMAIN === 'ph' || SUBDOMAIN === 'ph.dev')
	{
		header("HTTP/1.1 200 OK");
		header('Access-Control-Allow-Origin: *');
		header('Access-Control-Allow-Methods: GET');
		header('Access-Control-Max-Age: 0');
		die();
	}
}

// What should we present?
switch(strtolower($req))
{
	case 'online':
		// die();
		header('Content-type: text/html;charset=UTF-8');
		header('Content-length: '.filesize('./online.html'));
		readfile('./online.html');
		die();
	break;
	case 'error_log':
	case 'request.log':
	    die('The requested action is forbidden.');
	break;
	case 'request.php':
		header('Content-type: text/html;charset=UTF-8');
	    die('If you want the source, just visit <a href="https://github.com/Dubz/internetcheck.xyz" target="_blank">https://github.com/Dubz/internetcheck.xyz</a> lol');
	break;
	default:
		if(@$req[0] == '.'
		|| stripos($req, '..') !== false
		|| in_array(explode('/', $req.'/', 2)[0], array('src'))
		)
		    die('The requested action is forbidden.');
		if(file_exists($req))
		{
			try
			{
				header('Content-type: '.getMimeType($req, false).';charset=UTF-8');
				header('Content-length: '.filesize($req));
				readfile($req);
				die();
			}
			catch(Exception $e)
			{
				die('The request failed. Error: '.$e->getMessage().PHP_EOL);
			}
		}
		else
		{
			header('Content-type: text/html;charset=UTF-8');
			header('Content-length: '.filesize('./index.html'));
			readfile('./index.html');
			die();
		}
}
