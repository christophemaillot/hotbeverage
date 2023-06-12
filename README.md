# HotBeverage

## Description

HotBeverage is a nodejs static website generator.
This tools is largely inspired by Metalsmith ("An extremely simple, pluggable static site generator for NodeJS").

## Feature
- simplicity (code base is very small),
- built-in development server with basic live reload feature,
- built-it plugin for Nunjucks templating and Tailwindcss css processing


# Usage

```

```


# Writing a plugin

A HotBeverage plugin is a function that takes a HotBeverage Context instance as input, and use it to modify the output static website files through a Virtual FileSystem object.

## Very basic plugin that adds a version.txt file

```
function versionPlugin(versionStr) {

    return function(ctx) {
        const vfs = ctx.vfs
        vfs.add("version.txt", `version : {versionStr}`)
    }
}

```


# What's next ?

Planned features :
- better typescript support
- better live reload feature : trigger the live reloading when a output file has changed (as opposed to triggering the live reloading when a source file has changed)
- caching support for heavy file generation (like image processing)




