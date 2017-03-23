"use strict";

function init() {
};

var Animation = Homey.manager('ledring').Animation;

//------------------- Rainbow Dimmed Start ---------------------------------------------------
var frames_spectrum_dimmed = [];
var frame_spectrum_dimmed = [];

// for every pixel...
for( var pixel = 0; pixel < 24; pixel++ ) {

    var hue = (pixel/(24)) * 360;
    var color = hsvToRgbLow( hue, 100, 100 )

    frame_spectrum_dimmed.push({
        r: color[0], // 0 - 255
        g: color[1], // 0 - 255
        b: color[2]  // 0 - 255
    });
}

function hsvToRgbLow(h, s, v) {
    var r, g, b;
    var i;
    var f, p, q, t;

    // Make sure our arguments stay in-range
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s));
    v = Math.max(0, Math.min(100, v));

    // We accept saturation and value arguments from 0 to 100 because that's
    // how Photoshop represents those values. Internally, however, the
    // saturation and value are calculated from a range of 0 to 1. We make
    // That conversion here.
    s /= 100;
    v /= 100;

    if(s == 0) {
        // Achromatic (grey)
        r = g = b = v;
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    h /= 60; // sector 0 to 5
    i = Math.floor(h);
    f = h - i; // factorial part of h
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));

    switch(i) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;

        case 1:
            r = q;
            g = v;
            b = p;
            break;

        case 2:
            r = p;
            g = v;
            b = t;
            break;

        case 3:
            r = p;
            g = q;
            b = v;
            break;

        case 4:
            r = t;
            g = p;
            b = v;
            break;

        default: // case 5:
            r = v;
            g = p;
            b = q;
    }

    return [Math.round(r * 25), Math.round(g * 25), Math.round(b * 25)];
}

frames_spectrum_dimmed.push(frame_spectrum_dimmed);

var animation_spectrum_dimmed = new Animation({

    options: {
        fps     : 1, 	// real frames per second
        tfps    : 60, 	// target frames per second. this means that every frame will be interpolated 60 times
        rpm     : 12,	// rotations per minute
    },
    frames    : frames_spectrum_dimmed
})

animation_spectrum_dimmed.register(function(err, result){
	Homey.manager('ledring').registerScreensaver('spectrum_dimmed', animation_spectrum_dimmed)
	if( err ) return Homey.error(err);
	animation_spectrum_dimmed.on('screensaver_start', function( screensaver_id ){
		Homey.log('Screensaver started')
	})
	animation_spectrum_dimmed.on('screensaver_stop', function( screensaver_id ){
		Homey.log('Screensaver stopped')
	})
})
//------------------- Rainbow Dimmed Stop ---------------------------------------------------

Array.prototype.concat.apply([], [
	[
		{ id: 'red_alert', colors: [[0, 0, 0], [255, 0, 0]] },
		{ id: 'blue_alert', colors: [[0, 0, 0], [0, 0, 255]] }
	].map(screensaver => Object.assign(
		{ generator: generateLedAlert, options: Object.assign({ fps: 1, tfps: 4, rpm: 60 }, screensaver.options) },
		screensaver
	)),
	[
		{ id: 'led_flash_white', colors: [[255, 255, 255]] },
		{ id: 'led_flash_red', colors: [[255, 0, 0]] }
	].map(screensaver => Object.assign(
		{ generator: generateFlash, options: Object.assign({ fps: 16, tfps: 16, rpm: 0 }, screensaver.options) },
		screensaver
	)),
	[
		{ id: 'led_solid_red', colors: [[255, 0, 0]] }
	].map(screensaver => Object.assign(
		{ generator: generateSolid, options: Object.assign({ fps: 1, tfps: 60, rpm: 0 }, screensaver.options) },
		screensaver
	))
]).forEach((screensaver) => {

	// create animation with screensaver.options and generator(colors) function
	var animation = new Animation({
		options: screensaver.options,
		frames: screensaver.generator.apply(null, screensaver.colors)
	});

	// register animation
	animation.register(function (err, result) {
		Homey.manager('ledring').registerScreensaver(screensaver.id, animation);
		if (err) return Homey.error(err);
	})
});

function generateLedAlert( colRGB1, colRGB2 ) {
	var frames = [];
	var frame = [];
	var color = [];

	// for every pixel...
	for( var pixel = 0; pixel < 24; pixel++ ) {
		if( pixel < 12 ) { color = colRGB1; } else  { color = colRGB2; }
		frame.push({ r: color[0], g: color[1], b: color[2] });
	}
	frames.push(frame);
	return frames;
}

function generateFlash( colRGB ) {
	var frames = [];

	// for every frame...
	for( var fr = 0; fr < 32; fr++ ){
		var frame = [];
		if( fr == 2 ){
			var color = colRGB;
		} else {
			var color = [0, 0, 0];
		}

		// for every pixel...
		for( var pixel = 0; pixel < 24; pixel++ ) {
			frame.push({ r: color[0], g: color[1], b: color[2] });
		}
		frames.push(frame);
	}
	return frames;
}

function generateSolid( colRGB ) {
	var frames = [];
	var frame = [];
	var color = colRGB;

	// for every pixel...
	for( var pixel = 0; pixel < 24; pixel++ ) {
		frame.push({ r: color[0], g: color[1], b: color[2] });
	}
	frames.push(frame);
	return frames;
}
