var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');
var autoprefixer = require('gulp-autoprefixer');
var eslint = require('gulp-eslint');
var browserSync = require('browser-sync').create();
var sourcemaps = require('gulp-sourcemaps');

gulp.task('default', ['copy-html', 'copy-images', 'styles', 'scripts'],function() {

	gulp.watch('css/**/*.css', ['styles']);
	gulp.watch('/index.html', ['copy-html']);
	gulp.watch('./dist/index.html').on('change', browserSync.reload);
	browserSync.init({
		server: './'
	});
});

gulp.task('dist', [
	'copy-html',
	'copy-images',
	'styles',
	'lint',
	'scripts-dist'
]);

gulp.task('styles', function(){
    return gulp.src('css/**/*.css')
    .pipe(concat('styles.css'))
    .pipe(cleanCSS())
    .pipe(autoprefixer('last 2 versions'))
    .pipe(gulp.dest('dist/css'))
});

gulp.task('scripts', function() {
	gulp.src('js/**/*.js')
		.pipe(concat('all.js'))
		.pipe(gulp.dest('dist/js'));
});

// gulp.task('scripts-dist', function() {
// 	gulp.src('js/**/*.js')
// 		.pipe(sourcemaps.init())
// 		.pipe(concat('all.js'))
// 		.pipe(uglify())
// 		.pipe(sourcemaps.write())
// 		.pipe(gulp.dest('dist/js'));
// });

gulp.task('copy-html', function() {
	gulp.src('./index.html')
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', function() {
	gulp.src('img/*')
		.pipe(gulp.dest('dist/img'));
});

// gulp.task('lint', function () {
// 	return gulp.src(['js/**/*.js'])
// 		// eslint() attaches the lint output to the eslint property
// 		// of the file object so it can be used by other modules.
// 		.pipe(eslint())
// 		// eslint.format() outputs the lint results to the console.
// 		// Alternatively use eslint.formatEach() (see Docs).
// 		.pipe(eslint.format())
// 		// To have the process exit with an error code (1) on
// 		// lint error, return the stream and pipe to failOnError last.
// 		.pipe(eslint.failOnError());
// });