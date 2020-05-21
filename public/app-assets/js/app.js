//
// Wordpress Settings
//
var path          = 'http://parhum.net/a/today/',
    api_path      = path + 'wp-json/wp/v2/',
    api_posts     = api_path + 'posts',

    link_edit = function(data) {
      var data = (data ? data : {});

      return path + 'wp-admin/post.php?post=' + data.id + '&action=edit';
    };




//
// Ajax UNIT Functions
//

var tryCount = 0,
    retryCount = 3,
    timeout = 10000,
    xhr = null,

    ajax = (function (options) {
      if (!options) return;

      var defaultOptions = Object.assign({}, options);
      // if (options.url) options.url = BASE_URL + options.url;

      options.timeout = timeout;

      xhr = $.ajax(options);

      xhr.fail(function (error) {
        if (error.statusText === 'abort') {
          // console.log('xhr abort', error);
        } else {
          if (tryCount < retryCount-1) {
            tryCount++;
            ajax(defaultOptions);
          } else {
            errorHandler(error.status);
          }
        }
      });
      return xhr;
    }),

    errorHandler = function(status){
      switch (status) {
        case 500:
          console.log('500 Error');
          break;

        case 404:
          console.log('404 Error');
          break;

        default:
          console.log('Error!!');
          break;
      }
    },

    ajaxRejection = function() {
      if (xhr) {
        xhr.abort(['abort']);
      }
    };



//
// HTML Variables
//
var $todosList = $('#todos-list');



//
// Task Template
//
var temp_item = function(data) {
      var data = (data ? data : {}),
          html = '';

      for (var i = 0; i < data.length; i++) {
        var classNames = 'todo js__todo';

        if (data[i].actionTags_name && data[i].actionTags_name.length > 0) {
          for (var j = 0; j < data[i].actionTags_name.length; j++) {
              classNames += ' ' + data[i].actionTags_name[j];
          }
        }

        html += '<li class="' + classNames + '">';
          html += temp_item_title(data[i]);
          html += temp_item_tags(data[i]);
          html += temp_item_assignment(data[i]);
          // html += temp_item_meta(data[i]);
        html += '</li>';
      }

      return html;
    },

    temp_item_title = function(data) {
      var data = (data ? data : {}),
          html = '';

      if (data.title && data.title.rendered) {
        html += '<span class="title js__title"' + (data.link ? ' data-url="' + data.link + '"' : '') + '>';
          html += data.title.rendered;
        html += '</span>';
      }
      
      return html;
    }

    temp_item_assignment = function(data) {
      var data = (data ? data : {}),
          html = '';

      if (data.assignment_name) {
        // html += '<span class="assignment">';
        
        for (var i = 0; i < data.assignment_name.length; i++) {
          // http://parhum.net/a/today/wp-json/wp/v2/posts?assignment[]=41
          html += '<span class="assign"><a class="js__list-link" href="#@' + data.assignment[i] + '" data-type="assignment" data-id="' + data.assignment[i] + '" data-title="@' + data.assignment_name[i].display_name + '">@' +  data.assignment_name[i].display_name + '</a></span>';
        }

        // html += '</span>'
      }
      
      return html;
    },

    temp_item_tags = function(data) {
      var data = (data ? data : {}),
          html = '';

      if (data.tags) {
        // html += '<span class="tags-list">';
        
        for (var i = 0; i < data.tags.length; i++) {
          // http://parhum.net/a/today/wp-json/wp/v2/posts?tags[]=13
          html += '<span class="tag"><a class="js__list-link" href="#' + data.tags[i] + '" data-type="tags" data-id="' + data.tags[i] + '" data-title="#' + data.tags_name[i] + '">#' + data.tags_name[i] + '</a></span>';
        }

        // html += '</span>'
      }
      
      return html;
    },

    temp_item_meta = function(data) {
      var data = (data ? data : {}),
          html = '';

      html += '<div class="meta">';
        html += temp_item_author(data);
        html += temp_item_date(data);
        html += temp_item_edit(data);
      html += '</div>';
      
      return html;
    },

    temp_item_author = function(data) {
      var data = (data ? data : {}),
          html = '';

      if (data.author) {
        html += '<span class="author"><a href="#">@' + data.author + '</a></span>';
      }
      
      return html;
    },

    temp_item_edit = function(data) {
      var data = (data ? data : {}),
          html = '';

      if (data.title && data.title.rendered) {
        html += '<span class="edit">(<a href="' + link_edit(data) + '" target="_blank">ویرایش</a>)</span>';
      }
      
      return html;
    },

    temp_item_date = function(data) {
      var data = (data ? data : {}),
          html = '';

      if (data.date_gmt) {
        var date = new Date(data.date_gmt);
        date = date.getFullYear() + '/' + date.getDay() + '/' + date.getMonth();

        html += '<span class="date">' + date + '</span>';
      }
      
      return html;
    },

    temp_loading = function(options) {
      var options = (options ? options : {}),
          html = '';

      html = '<div class="LoaderBalls"><div class="LoaderBalls__item"></div><div class="LoaderBalls__item"></div><div class="LoaderBalls__item"></div></div>';

      return html;
    },

    temp_taxonomies_item = function(options, data) {
      var options = (options ? options : {}),
          data    = (data ? data : {}),
          sign    = '',
          html    = '';
        
      if (options.type === 'tags') {
        sign = '#';
      } else if (options.type === 'assignment') {
        sign = '@';
      } else if (options.type === 'actionTags') {
        sign = '';
      }

      for (var i = 0; i < data.length; i++) {
        if (data[i].count > 0) {
          html += '<li class="taxonomies-item js__taxonomies-item">';
            html += '<a class="js__list-link" href="#' + sign + data[i].name + '" data-type="' + options.type + '" data-id="' + data[i].id + '" data-title="' + sign + data[i].name + '">'
              html += sign + data[i].name;
              // html += '<span class="count">(' + data[i].count + ')</span>';
            html += '</a>';
          html += '</li>';
        }
      }

      return html;
    };



//
// Get List
//

var load_tasks = function(options) {
      $todosList.html(temp_loading(options));

      ajax({
        url: options.api,
        method: "GET",
      }).done(function (data) {
        try {
          // console.log('load_tasks', data);

          $todosList.html(temp_item(data));
        } catch (e) {
          console.error(e);
        }
      }).fail(function(error) {
        if (error.statusText === 'abort') {
          // console.log('abort', error);
        } else {
          console.error(JSON.parse(error.responseText));
        }
      });
    },

    load_taxonomies = function(options) {
      var options = (options ? options : {});

      if (options.type) {
        var $selector = $('#' + options.type + '-list');

        ajax({
          url: api_path + options.type,
          method: "GET",
        }).done(function (data) {
          try {
            // console.log('load_taxonomies', data);

            $selector.html(temp_taxonomies_item(options, data))
          } catch (e) {
            console.error(e);
          }
        }).fail(function(error) {
          if (error.statusText === 'abort') {
            // console.log('abort', error);
          } else {
            console.error(JSON.parse(error.responseText));
          }
        });
      }
    };


//
// Init App
//

// Load All Tasks
load_tasks({api: api_posts});

// Load Taxonomy Links
load_taxonomies({type: 'tags'});
load_taxonomies({type: 'assignment'});
load_taxonomies({type: 'actionTags'});



//
// Events
//



//
// Title Events
//

// Done Event
$('body').on('click', '.js__title', function(e){
  e.preventDefault();

  $(this).parent('.js__todo').toggleClass('done');
});



//
// Tag Events
//

// Open Tag
$('body').on('click', '.js__list-link', function(e){
  e.preventDefault();

  var id    = $(this).attr('data-id'),
      title = $(this).attr('data-title'),
      type  = $(this).attr('data-type');

  if (type && id) {
    load_tasks({api: api_posts + '?' + type + '[]=' + id});

    if (title) {
      $('#page-title').text(title);
    }
  } else {
    load_tasks({api: api_posts});

    if (title) {
      $('#page-title').text(title);
    }
  }
});




// {
//     "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOlwvXC9wYXJodW0ubmV0XC9hXC90b2RheSIsImlhdCI6MTU3MTM3ODgxMywibmJmIjoxNTcxMzc4ODEzLCJleHAiOjE1NzE5ODM2MTMsImRhdGEiOnsidXNlciI6eyJpZCI6IjEifX19.MNV-pmxbePtDi5a1FGoRi-xw9wB3PZGj-7xHl3P3NJg",
//     "user_email": "p.khoshbakht@sabaidea.com",
//     "user_nicename": "todayadmin",
//     "user_display_name": "todayadmin"
// }








