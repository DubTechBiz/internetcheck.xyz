<?php

require_once './src/BasicFunctions/basicfunctions.php';

// Define some needed data for easier use
define("HONEYPOT_RUNNING", true);
define("CLIENT_IP", getIP());
define("SUBDOMAIN", implode('.', array_slice(explode('.', $_SERVER['SERVER_NAME']), 0, -2)));

// $req = array_key_exists('req', $_GET) ? $_GET['req'] : 'index.html';
$req = substr($_SERVER['SCRIPT_URL'], 1) or false;

# This seemed relatively important, so we're gonna put it up here.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

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
		header('Access-Control-Max-Age: 0');
		die();
	}
	if(in_array($_SERVER['HTTP_USER_AGENT'],
		array(
			'Nuclei - Open-source project (github.com/projectdiscovery/nuclei)'
		)
	)
	|| stripos($_SERVER['HTTP_USER_AGENT'], 'passwd')
	)
	{
		header('HTTP/1.1 402 Payment Required');
		header('Access-Control-Max-Age: 0');
		$responses = array('Yeah, this is pretty much a guaranteed above PG rating...', 'Oh yeah', 'Oooooh', 'That feels so good', 'Yesss', 'Harder daddy', 'Paint me like one of your french bears', 'If at first you don\'t succeed, go play in traffic.', 'We all know you\'re touching yourself...', 'It\'s okay to feel sad sometimes.', 'You won!', 'lol', 'You thought.', 'Try again later', 'Try again later', 'Try again later', 'Try again later', 'You owe me $20', 'Tell your mom I\'m sorry about busting her headboard.', 'Try getting some fresh air.', 'Thank you for keeping your distance during these times.', 'Please stay at least 6 feet apart.', 'The cake is a lie', 'This response is brought to you by: DEEZ NUTS', 'Ha, gotem.', 'You know {insert pathetic wannabe hacker\'s name}, sometimes...I don\'t believe I know you...', 'Show me your tits', 'Send it', 'You can do it!', 'You\'re almost there...', 'Did you try turning it off and back on again??', 'If you need some help, please hang up and call the operator.', 'Dude where\'s my car?', 'iykyk', 'Tiktok is literally cancer.', 'How much wood coulda woodchuck chuck, if a woodchuck could chuck wood?', 'A woodchuck could chuck as much wood as a woodchuck could chuck, if a woodchuck could chuck wood.', 'Hey you dang woodtouch, quit touching your wood!', 'You seem like the kind of person who gets off on Miley Cyrus when she came in on a wrecking ball.', 'Yo dawg I heard your lookin for vulns?', 'Are you *seriously* still here? The entire source for this folder is literally on Github...', 'Did you even try reading the page\'s HTML comments, or are you that special kinda retarded?');
		print $responses[array_rand($responses)];
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
