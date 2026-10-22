<?php

// Both PHP2Shell advisories require PHP 8.5.12 on our PHP 8.5 runtime:
// GHSA-w8hw-w9fx-j79w and GHSA-6wmf-4rv5-p3rp.
if (PHP_VERSION_ID < 80512) {
    fwrite(STDERR, 'PHP >= 8.5.12 is required; running '.PHP_VERSION.PHP_EOL);
    exit(1);
}

fwrite(STDOUT, 'PHP security baseline passed: '.PHP_VERSION.PHP_EOL);
