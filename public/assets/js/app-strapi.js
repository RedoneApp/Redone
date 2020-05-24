//
// Wordpress Settings
//
var api_path     = '/',
    api_tasks    = api_path + 'tasks',
    api_tags     = api_path + 'tags',
    api_users    = api_path + 'users',

    // Authenticaiton
    api_login    = api_path + 'auth/local/',
    me,


    isPortraiteMobile = window.innerHeight > window.innerWidth,


    link_edit = function(data) {
      var data = (data ? data : {});

      return '#' + data.id;
    },

    send_datalayer = function(event, props) {
      var eventProps = {};
      eventProps.event = event;
      eventProps.attributes = Object.assign({}, props);

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(eventProps);

      // console.log(window.dataLayer[window.dataLayer.length - 1]);
    };




//
// Ajax UNIT Functions
//

var tryCount = 0,
    retryCount = 5,
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
          // "Unauthorized: Invalid authorization header format. Format is Authorization: Bearer [token]"
          if (error.responseJSON && error.responseJSON.statusCode === 401) {
            // logout
            auth_logout();
          } else {
            if (tryCount < retryCount-1) {
              tryCount++;
              ajax(defaultOptions);
            } else {
              errorHandler(error.status);
            }
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
var $todosList        = $('#todos-list'),
    $pageTitle        = $('#page-title'),

    // Modal
    $modal          = $('#modal'),
    $modal_content  = $('#modal-content'),
    $modal_yes      = $('#modal-yes'),
    $modal_no       = $('#modal-no'),

    // Focus Mode
    $focusMode      = $('#focus-mode'),
    $focusContent   = $('#focus-content'),

    // Focus Mode
    $afterLogin     = $('#after-login'),
    $beforeLogin    = $('#before-login'),
    $me             = $('#me'),

    $item_addField;



//
// Task Template
//
var temp_items = function(data) {
      data = (data ? data : {});
      var html = '';

      // console.warn(data);

      for (var i = 0; i < data.length; i++) {
        html += temp_item(data[i]);
      }

      // Update LocalStorage Tags
      // Load Taxonomy Links
      load_tags();
      load_users();

      return html;
    },

    temp_item = function(item) {
      get_assignmentAndTags(item);
      item = (item ? item : {});
      var html = '',
          classNames = 'todo js__todo';

      html += '<li class="' + classNames + '" data-state="' + (item.Done ? 'done' : 'todo') + '" id="item-' + item.id + '" data-id="' + item.id + '" data-title="' + item.Title + '">';
      html += '<a href="#" class="clear-it DOEM" id="clear-it"><i class="material-icons">clear_all</i></a>';
      html += temp_item_title(item);
      // html += temp_item_tags(item);
      // html += temp_item_assignment(item);
      // html += temp_item_meta(item);
      html += '<a href="#" class="focus-it DOEM" id="focus-it"><i class="material-icons">filter_center_focus</i></a>';
      html += '</li>';

      return html;
    },

    temp_item_title = function(data) {
      data = (data ? data : {});
      var html = '';

      data.Title = data.Title + ' '; // This space make regex work for texts that ends with #tag

      for (var i = 0; i < data.tags.length; i++) {
        var regexStr = new RegExp('#' + data.tags[i].Title + ' ', 'g');
        data.Title = (data.Title).replace(regexStr, '<a href="#' + data.tags[i].Title + '" data-type="tags" data-id="' + data.tags[i].id + '" data-title="#' + data.tags[i].Title + '">#' + data.tags[i].Title + '</a> ');
      }

      for (var i = 0; i < data.assign.length; i++) {
        var regexStr = new RegExp('@' + data.assign[i].username + ' ', 'g');
        data.Title = (data.Title).replace(regexStr, '<a href="@' + data.assign[i].Title + '" data-type="assign" data-id="' + data.assign[i].id + '" data-title="@' + data.assign[i].username + '">@' + data.assign[i].username + '</a> ');
      }

      if (data.Title) {
        html += '<span class="title js__title">';
          html += '<span class="checkbox"></span>';

          if (data.created_by && data.created_by.id !== me.user.id) {
            html += '<span class="created_by">' + data.created_by.username + ':</span>';
          }

          html += data.Title;
        html += '</span>';
      }
      
      return html;
    },

    temp_item_assignment = function(data) {
      var data = (data ? data : {}),
          html = '';

      if (data.assign) {
        // html += '<span class="assignment">';

        for (var i = 0; i < data.assign.length; i++) {
          html += '<span class="assign"><a href="#@' + data.assign[i].id + '" data-type="assign" data-id="' + data.assign[i].id + '" data-title="@' + data.assign[i].username + '">@' +  data.assign[i].username + '</a></span>';
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
          html += '<span class="tag"><a href="#' + data.tags[i].Title + '" data-type="tags" data-id="' + data.tags[i].id + '" data-title="#' + data.tags[i].Title + '">#' + data.tags[i].Title + '</a></span>';
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

      if (data.Deadline) {
        var date = new Date(data.Deadline);
        date = date.getFullYear() + '/' + date.getDay() + '/' + date.getMonth();

        html += '<span class="date">' + date + '</span>';
      }
      
      return html;
    },

    temp_loading = function(options) {
      var options = (options ? options : {}),
          html = '';

      html = '<div class="js__loading LoaderBalls"><div class="LoaderBalls__item"></div><div class="LoaderBalls__item"></div><div class="LoaderBalls__item"></div></div>';

      return html;
    },

    temp_tags_item = function() {
      // var options = (options ? options : {}),
      //     data    = (data ? data : {}),
          var html    = '';

      // for (var i = 0; i < data.length; i++) {
      //   if (data[i].tasks.length > 0) {
      //     html += '<li class="taxonomies-item js__taxonomies-item">';
      //       html += '<a href="#' + data[i].Title + '" data-type="tags" data-id="' + data[i].id + '" data-title="#' + data[i].Title + '">'
      //         html += '#' + data[i].Title;
      //         // html += '<span class="count">(' + data[i].count + ')</span>';
      //       html += '</a>';
      //     html += '</li>';
      //   }
      // }

      for (var id in myTags) {
        html += '<li class="taxonomies-item js__taxonomies-item">';
          html += '<a href="#' + myTags[id] + '" data-type="tags" data-id="' + id + '" data-title="#' + myTags[id] + '">'
            html += '#' + myTags[id];
          html += '</a>';
        html += '</li>';
      }

      return html;
    },

    noMentions = '!Mentions',

    temp_users_item = function() {
      // var options = (options ? options : {}),
          // data    = (data ? data : {}),
        var html    = '';

      // for (var i = 0; i < data.length; i++) {
      //   if (data[i].tasks.length > 0) {
      //     html += '<li class="taxonomies-item js__taxonomies-item">';
      //       html += '<a href="#@' + data[i].username + '" data-type="assign" data-id="' + data[i].id + '" data-title="@' + data[i].username + '">'
      //         html += '@' + data[i].username;
      //         // html += '<span class="count">(' + data[i].count + ')</span>';
      //       html += '</a>';
      //     html += '</li>';
      //   }
      // }

      html += '<li class="taxonomies-item js__taxonomies-item no-mention">';
      html += '<a href="#' + noMentions + '" data-type="' + noMentions + '" data-id="' + noMentions + '" data-title="' + noMentions + '">'
      html += noMentions;
      html += '</a>';
      html += '</li>';

      for (var id in myAssignment) {
        html += '<li class="taxonomies-item js__taxonomies-item">';
        html += '<a href="#@' + myAssignment[id] + '" data-type="assign" data-id="' + id + '" data-title="@' + myAssignment[id] + '">'
        html += '@' + myAssignment[id];
        html += '</a>';
        html += '</li>';
      }

      return html;
    },

    myAssignment = {},
    myTags = {},

    get_assignmentAndTags = function(data) {
      data = (data ? data : {});

      // Assignment
      if (data.assign && data.assign.length > 0) {
        for (var i = 0; i < data.assign.length; i++) {
          if (myAssignment[data.assign[i].id] === undefined) {
            if (data.assign[i].id !== me.user.id) { // Don't show my name under the page
              myAssignment[data.assign[i].id] = data.assign[i].username;
            }
          }
        }
      }

      // Tags
      if (data.tags && data.tags.length > 0) {
        for (var i = 0; i < data.tags.length; i++) {
          if (myTags[data.tags[i].id] === undefined) {
            myTags[data.tags[i].id] = data.tags[i].Title;
          }
        }
      }
    };




//
// Get List
//

var load_tasks_params = function(params) {
      params = (params ? params : {});

      if (!params['_sort']) {
        params['_sort'] = 'created_at:DESC';
      }

      var paramsStr = '',
          paramIndex = 0;

      for (var prop in params) {
        if (paramIndex == 0) {
          paramsStr += '?';
        } else {
          paramsStr += '&';
        }

        paramsStr += prop + '=' + params[prop];

        paramIndex++;
      }

      return paramsStr;
    },

    load_tasks_ajax = function(params) {
      ajax({
        url: api_tasks + load_tasks_params(params),
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + me.jwt
        },
      }).done(function (data) {
        try {
          var dataLayerProps = Object.assign({}, params);
          dataLayerProps.items_count = (data.length ? data.length : 0);
          dataLayerProps.user_id = me.user.id;

          if (dataLayerProps.assign_in && dataLayerProps.assign_in === dataLayerProps.user_id) {
            dataLayerProps.state = 'mentioned_items';
          } else if (dataLayerProps.created_by_in && dataLayerProps.created_by_in === dataLayerProps.user_id) {
            dataLayerProps.state = 'created_items';
          }

          send_datalayer('load_tasks_ajax', dataLayerProps);
        }
        catch(error) {
          console.error(error);
        }


        var html = '';

        $('.js__loading').remove();

        if (data.length > 0) {
          html += temp_items(data);
          $todosList.append(html);

          if (params.assign_in && !params.created_by_in && !params.created_by_nin) {
            notifyShowOnItems();
          }
        }
      }).fail(function(error) {
        if (error.statusText === 'abort') {
          // console.log('abort', error);
        } else {
          console.error(JSON.parse(error.responseText||'{}'));
        }
      });
    },

    load_tasks = function(options) {
      options = (options ? options : {});
      var tempParams = Object.assign({}, options.params);
      $todosList.html(temp_loading(options));

      if (parseInt(tempParams['assign_in']) === me.user.id) { // Show all my tasks
        // tempParams['created_by_in'] = me.user.id;

        load_tasks_ajax(tempParams);
      } else if (tempParams['assign_in']) { // Just load Assign ID that created by me!
        tempParams['created_by_in'] = me.user.id;

        load_tasks_ajax(tempParams);
      } else {
        tempParams = Object.assign({}, options.params);
        tempParams['created_by_in'] = me.user.id;
        load_tasks_ajax(tempParams);

        tempParams = Object.assign({}, options.params);
        tempParams['assign_in'] = me.user.id;
        tempParams['created_by_nin'] = me.user.id;
        load_tasks_ajax(tempParams);
      }

      // load_tasks_ajax('I Create', tempParams);
    },

    load_tags = function() {
        var $selector = $('#tags-list');

        $selector.html(temp_tags_item());

        ajax({
          url: api_tags + '?_sort=title:DESC',
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + me.jwt
          },
        }).done(function (data) {
          try {
            // console.log('load_tags', data);
            localStorage.setItem('tags', JSON.stringify(data));

            // $selector.html(temp_tags_item(data));
          } catch (e) {
            console.error(e);
          }
        }).fail(function(error) {
          if (error.statusText === 'abort') {
            // console.log('abort', error);
          } else {
            console.error(JSON.parse(error.responseText||'{}'));
          }
        });
    },

    load_users = function() {
        var $selector = $('#users-list');
        $selector.html(temp_users_item());

        ajax({
          url: api_users,
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + me.jwt
          },
        }).done(function (data) {
          try {
            // console.log('load_users', data);
            localStorage.setItem('users', JSON.stringify(data));
            // $selector.html(temp_users_item(data));
          } catch (e) {
            console.error(e);
          }
        }).fail(function(error) {
          if (error.statusText === 'abort') {
            // console.log('abort', error);
          } else {
            console.error(JSON.parse(error.responseText||'{}'));
          }
        });
    };




var toggle_done = function(id, state) {
      var dataLayerProps = {};
      dataLayerProps.action = (state ? 'done' : 'undone');
      send_datalayer('toggle_done', dataLayerProps);

      ajax({
        url: api_tasks + '/' + id,
        method: "PUT",
        data: JSON.stringify({"Done": state}),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + me.jwt
        },
      }).done(function (data) {
        if (state) {
          notifyItem('done', data);
        } else {
          notifyItem('undone', data);
        }

      }).fail(function(error) {
        if (error.statusText === 'abort') {
          // console.log('abort', error);
        } else {
          console.error(JSON.parse(error.responseText||'{}'));
        }
        

        if (state) {
          state = 'todo';
        } else {
          state = 'done';
        }

        $('[data-id="' + id + '"]').attr('data-state', state);
      });
    };

var add_item_dataLayer = {},
    add_item = function(title, id) {
      add_item_dataLayer = {};

      var tags      = get_signs(title, '#'),
          mentions  = get_signs(title, '@');

      add_item_dataLayer.tags_count     = (tags.length ? tags.length : 0);
      add_item_dataLayer.mentions_count = (mentions.length ? mentions.length : 0);

      var subjectData =  {
            'Title': title,
            tags: [],
            assign: []
          };

      if (tags.length > 0) {
        add_tags(mentions, tags, subjectData, id);
      } else {
        // console.warn('addSubject', 'No TAGS');
        add_mentionsAndSubject(mentions, subjectData, id);
      }
    },

    add_exit = function() {
      $('#modal-add-item').removeClass('active');
      $('.' + itemField_name).val(item_addPlaceholder);
      $('.' + itemField_name).blur();
    };

    add_tags = function(mentions, tags, subjectData, id) {
      var listOfTagsNames	    = [],
          listOfTags	        = JSON.parse(localStorage.tags||'{}');
  
      for (var i = 0; i < listOfTags.length; i++) {
        listOfTagsNames.push(listOfTags[i].Title);

        for (var j = 0; j < tags.length; j++) {
          if (listOfTags[i].Title === tags[j]) {
            subjectData.tags.push({'id': listOfTags[i].id});
          }
        }
      }
  
      var newTags = tags.filter(function(val) {
        return listOfTagsNames.indexOf(val) == -1;
      });
  
      if (newTags.length > 0) {
        // console.warn('addSubject', 'New Tags:', newTags);
  
        // calls the provided url and returns a reference to the Ajax call
        var createTag = function(tagName) {
            return $.ajax({
              url: api_tags,
              method: "POST",
              data: {'Title': tagName},
              headers: {
                // "Content-Type": "application/json",
                "Authorization": "Bearer " + me.jwt
              },
              success: function(data) {
                // console.log(tagName, data);
              }
            });
          },
          results = [],
          tagNames = newTags;
  
        // store the reference to the Ajax api for later usage
        for (var i = 0; i < tagNames.length; i++) {
          results.push(createTag(tagNames[i]));
        }
  
        // invoke each function stored in the result array and proceed when they are all done
        $.when.apply(this, results).done(function () {
  
          var newTagsData = [];
          // fetch the result from each arg
          // each arg contains the result of one succes ajax function.
          // in this case, three arguments exist, one for each ajax call.
          for (var i = 0; i < arguments.length; i++) {
  
            // retrieve the entries from the argument parameter
            // console.log(arguments[i]);
  
            // push the retrieved value to a global function variable, which we can.
            // this function is processed synchronously, when all ajax calls have been completed
            newTagsData.push(arguments[i]);
  
          };
          // console.warn('newTagsData', newTagsData);
  
          var merged = [];
  
          // merge the arrays
          if (newTagsData[0].length > 1) {
            for (var i = 0; i < newTagsData.length; i++) {
              if (newTagsData[i][1] === 'success') {
                merged.push(newTagsData[i][0]);
              }
            };
          } else {
            merged.push(newTagsData[0]);
          }
  
          // and log them to the console
          // console.warn('Tags Added:', merged);
  
          for (var j = 0; j < merged.length; j++) {
            subjectData.tags.push({'id': merged[j].id});
          }
  
  
          add_mentionsAndSubject(mentions, subjectData, id);
        });
      } else {
        // console.warn('addSubject', 'Not New tags');
  
        add_mentionsAndSubject(mentions, subjectData, id);
      }

      add_item_dataLayer.tags_new_count = (newTags.length ? newTags.length : 0);
    },

    add_mentions = function(mentions, subjectData) {
      var listOfUsersNames	  = [],
          listOfUsers	        = JSON.parse(localStorage.users||'{}');

      subjectData = (subjectData ? subjectData : {});

      if (listOfUsers.length > 0) {
        for (var i = 0; i < listOfUsers.length; i++) {
          listOfUsersNames.push(listOfUsers[i].username);

          for (var j = 0; j < mentions.length; j++) {
            if (listOfUsers[i].username === mentions[j]) {
              subjectData.assign.push({id: listOfUsers[i].id});
            } else {
              // Create this user
              // console.log(mentions[j]);
            }
          }
        }
      }

      var newUsers = [];
      if (mentions.length > 0) {
        newUsers = mentions.filter(function(val) {
          return listOfUsersNames.indexOf(val) == -1;
        });

        if (newUsers.length > 0 ) {
          console.warn('newUsers', newUsers);
        }
      }

      add_item_dataLayer.mentions_new_count = (newUsers.length ? newUsers.length : 0);

      return subjectData;
    },

    add_mentionsAndSubject = function(mentions, subjectData, id) {
      // Validate @mentions
      subjectData = add_mentions(mentions, subjectData, id);

      // AJAX to Create Subject
      add_itemAjax(subjectData, id);
    },

    add_itemAjax = function(subjectData, id) {

      var ajax_method,
          ajax_url = api_tasks;

      if (id) { // Edit Mode
        ajax_method = 'PUT';
        ajax_url    += '/' +  id;

        if (subjectData.assign.length === 0) {
          subjectData.assign = null;
        }

        if (subjectData.tags.length === 0) {
          subjectData.tags = null;
        }
      } else { // Add Item
        ajax_method = 'POST';
        subjectData.created_by = {};
        subjectData.created_by.id = me.user.id;
      }

      ajax({
        url:    ajax_url,
        method: ajax_method,
        data:   subjectData,
        headers: {
          // "Content-Type": "application/json", // This Doesn't work for this request
          "Authorization": "Bearer " + me.jwt
        },
      }).done(function (data) {
        if (id) { // Edit Mode
          notifyItem('edit', data);

          add_item_dataLayer.action = 'edit';

          $('#item-' + id).replaceWith(temp_item(data));
        } else { // Add Item
          notifyItem('add', data);

          add_item_dataLayer.action = 'add';

          $todosList.prepend(temp_item(data));
        }
        
        add_item_dataLayer.tags_new_count  = (add_item_dataLayer.tags_new_count ? add_item_dataLayer.tags_new_count : 0);
        add_item_dataLayer.mentions_new_count  = (add_item_dataLayer.mentions_new_count ? add_item_dataLayer.mentions_new_count : 0);
        send_datalayer('add_itemAjax', add_item_dataLayer);

        // Update LocalStorage Tags
        // Load Taxonomy Links
        load_tags();
        load_users();
      }).fail(function(error) {
        if (error.statusText === 'abort') {
          // console.log('abort', error);
        } else {
          console.error(JSON.parse(error.responseText||'{}'));
        }
      });
    },

    get_signs = function(str, sign) {
      var regexp = '';

      if (sign == '#') {
        regexp = /#([\w\:]+)/gm;
      } else if (sign == '@') {
        regexp = /(\s|^)\@\w\w+\b/gm;
      }

      result = str.match(regexp);
      if (result) {
        result = result.map(function(s){
          s = s.replace(sign, '');
          s = s.trim();

          if (s.includes(':')) {
            s = s.split(':')
          }

          return s;
        });

        return result;
      } else {
        return false;
      }
    };




//
// Delete
//

var item_addPlaceholder = 'Write #tags and @mentions ...',

    // Check Click and Double Click for edit mode
    item_timer = 0,
    item_delay = 250,
    item_prevent = false,

    delete_item = function(id) {
      // ajax({
      //   url: api_tasks + '/' + id,
      //   method: "GET",
      //   headers: {
      //     "Content-Type": "application/json",
      //     "Authorization": "Bearer " + me.jwt
      //   },
      // }).done(function (data) {
        // if (data.created_by.id === me.user.id) {
          ajax({
            url: api_tasks + '/' + id,
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + me.jwt
            },
          }).done(function (data) {
            notifyItem('delete', data);

            try {
              var dataLayerProps = {};
              dataLayerProps.action = 'delete';
              dataLayerProps.mentions_count = (data.assign.length ? data.assign.length : 0);
              dataLayerProps.tags_count     = (data.tags.length ? data.tags.length : 0);
              send_datalayer('delete_item', dataLayerProps);
            }
            catch(error) {
              console.error(error);
            }

            $('#item-' + id).remove();
          }).fail(function(error) {
            if (error.statusText === 'abort') {
              // console.log('abort', error);
            } else {
              console.error(JSON.parse(error.responseText||'{}'));
            }
          });
        // } else {
        //   alert('Sorry you don\'t create this task and you can\'t delete it');
        // }
      // }).fail(function(error) {
      //   if (error.statusText === 'abort') {
      //     // console.log('abort', error);
      //   } else {
      //     console.error(JSON.parse(error.responseText||'{}'));
      //   }
      // });
    },

    confirm_box = function(question, yes, no, yes_dataName, yes_dataValue) {
      question  = (question   ? question  : 'Are you sure?');
      no        = (no         ? no        : 'No');

      $modal_content.html(question);

      if (yes) {
        if (yes_dataName && yes_dataValue) {
          $modal_yes.text(yes).attr(yes_dataName, yes_dataValue);
        }
      } else {
        $modal_yes.hide();
      }

      $modal_no.text(no);
      $modal.addClass('active');
    },

    validate_exitKey = function (e) {
      return  e.keyCode === 27;
    },

    validate_submitKey = function (e) {
      var submitAction = false;

      if (isPortraiteMobile) { // in mobile just press Enter to save
        submitAction = (e.keyCode == 13);
      } else { // in desktop use ctrl or command + enter to save
        submitAction = (e.metaKey || e.ctrlKey) && e.keyCode == 13;

        if (!submitAction && e.keyCode == 13) {
          var $notifySomething = $('#notify-something');
          $notifySomething.html('Use <code>command+enter</code> or <code>ctrl+enter</code> to save it...').addClass('active');
          setTimeout(function(){
            $notifySomething.removeClass('active');
          }, 3000);

        }
      }

      return submitAction;
    },

    itemField_name = 'js__add-item-autocomplete',

    itemField_add = function() {
      // Add HTML
      $('#todo-new-subject').html(itemField_temp());

      // Define Selector
      $item_addField = $('.' + itemField_name);

      // Define Events
      itemField_events();
    },

    itemField_temp = function() {
      var html = '' +
        '<li class="todo">' +
          '<span class="checkbox"></span>' +
          '<textarea id="todo-new-subject-text" class="hide-in-mobile add-item-autocomplete ' + itemField_name + '" placeholder="' + item_addPlaceholder + '"></textarea>' +
          '<div class="add-item-autocomplete js__show-add-modal show-in-mobile">Just #write and @mention ...</div>' +
        '</li>';

      return html;
    },

    itemField_events = function() {
      $('.' + itemField_name).textcomplete([
        {
          // #3 - Rgular experession used to trigger search
          match: /(^|\s)@(\w*(?:\s*\w*))$/,

          // #4 - Function called at every new keystroke
          search: function(query, callback) {
            ajax({
              url: api_users + (!!query ? '?username_contains=' + query : ''),
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + me.jwt
              },
            }).done(function (data) {
              callback(data);
            }).fail(function(error) {
              if (error.statusText === 'abort') {
                // console.log('abort', error);
              } else {
                console.error(JSON.parse(error.responseText||'{}'));
              }
            });
          },

          // #5 - Template used to display each result obtained by the Algolia API
          template: function (hit) {
            // Returns the highlighted version of the name attribute
            return hit.username;
          },

          // #6 - Template used to display the selected result in the textarea
          replace: function (hit) {
            return ' @' + hit.username.trim() + ' ';
          }
        }
      ], {
        footer: ''// '<a href=#">Invite your friends with a Twitter message!'
      });

      $('.' + itemField_name).textcomplete([
        {
          // #3 - Rgular experession used to trigger search
          match: /(^|\s)#(\w*(?:\s*\w*))$/,

          // #4 - Function called at every new keystroke
          search: function(query, callback) {
            ajax({
              url: api_tags + (!!query ? '?Title_contains=' + query : ''),
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + me.jwt
              },
            }).done(function (data) {
              callback(data);
            }).fail(function(error) {
              if (error.statusText === 'abort') {
                // console.log('abort', error);
              } else {
                console.error(JSON.parse(error.responseText||'{}'));
              }
            });
          },

          // #5 - Template used to display each result obtained by the Algolia API
          template: function (hit) {
            // Returns the highlighted version of the name attribute
            return hit.Title;
          },

          // #6 - Template used to display the selected result in the textarea
          replace: function (hit) {
            return ' #' + hit.Title.trim() + ' ';
          }
        }
      ], {
        footer: ''// '<a href=#">Invite your friends with a Twitter message!'
      });
    },
    
  
    item_toggleDone = function(e, item) {
      if ($(e.target).is('[data-type="tags"], [data-type="tags"] *, [data-type="assign"], [data-type="assign"] *')) {
      } else {
        var $parrent       = $(item).parents('.js__todo'),
          currentState  = $parrent.attr('data-state'),
          newState      = (currentState === 'done' ? 'todo' : 'done');

        $parrent.attr('data-state', newState);
        toggle_done(parseInt($parrent.attr('data-id')), (newState === 'done' ? true : false));
      }
    },

    item_saveEditMode = function(id, title) {
      if (title === '') {
        delete_item(id);
      } else {
        add_item(title, id);
      }

      item_exitEditMode();
    },

    item_exitEditMode = function() {
      // Remove edit-mode class from other elements
      $('.js__todo').removeClass('edit-mode');

      // Remove other Editable Title Elements
      if ($('#editable-title').length > 0) {
        $('#editable-title').remove();
      }
    },


    item_openEditMode = function(item) {
      var $this           = $(item),
          $parent         = $this.parents('.js__todo'),
          $title          = $this,
          id              = $parent.attr('data-id'),
          title           = $parent.attr('data-title'),
          editableTitleTextarea   = '<textarea data-id="' + id + '" data-currentTitle="' + title + '" class="add-item-autocomplete ' + itemField_name + ' active">' + title + '</textarea>',
          editableTitle   = '<span id="editable-title" class="editable-title"><span class="checkbox"></span>' + editableTitleTextarea + '</span>';


      // Exit Edit Mode
      item_exitEditMode();

      // Append Editable Title after Main Title
      $title.after(editableTitle);

      // Append Editable Title after Main Title
      $parent.addClass('edit-mode');

      $('#editable-title .' + itemField_name).focus();
      //   _setCarretPosition();

      // Define Events
      itemField_events();
    },

    _setCarretPosition = function(id) {
      if ($('#' + id).text() === '') {
        return;
      }

      var node = document.getElementById(id),
          textNode = node.firstChild,
          caret = textNode.length,
          range = document.createRange(),
          sel = window.getSelection();

      node.focus();

      range.setStart(textNode, caret);
      range.setEnd(textNode, caret);

      sel.removeAllRanges();
      sel.addRange(range);
    },

    notifyItem = function(action, data) {
      if (data.assign && data.assign.length > 0) {
        var item = {action: action, data: data};
        // console.warn('GET ITEM',item);

        for (var i = 0; i < item.data.assign.length; i++) {
          if (me.user.id !== item.data.assign[i].id) {
            var notifications 	= (item.data.assign[i].notifications ? item.data.assign[i].notifications : {});
            notifications.hey 	= (notifications.hey ? notifications.hey : []);

            // console.log(item.data.assign[i].username, 'Current Notification:', notifications);

            notifications.hey.push({
              action: item.action,
              id: item.data.id,
              // data: item.data
            });

            // console.warn(item.data.assign[i].username, 'Updated Notification:', notifications);
            notifyAjax(item.data.assign[i].id, notifications);
          }
        };
      }
    },

    notifyShow = function() {
      var html = '';

      if (me.user.notifications && me.user.notifications.hey && me.user.notifications.hey.length) {
        // console.log('wow, you have', me.user.notifications.hey.length, 'notifications!');
        $me.attr('data-notify', me.user.notifications.hey.length).addClass('has-notify');
      } else {
        // console.log('you don\'t have any notification');
      }
    },

    notifyHide = function() {
      $me.attr('data-notify', 0).removeClass('has-notify');
    },

    notifyShowOnItems = function() {
      if (me.user.notifications && me.user.notifications.hey && me.user.notifications.hey.length) {
        var hey = me.user.notifications.hey;

        // Empty local notifications
        me.user.notifications = {};

        // Hide Notify Count
        notifyHide();

        // Add higlight class to notify items
        for (var i = 0; i < hey.length; i++) {
          $('#item-' + hey[i].id + ' .js__title').addClass('highlight');
        }

        // Empty user notification data
        notifyAjax(me.user.id, false);
      }
    },

    notifyAjax = function(userid, notifications) {
      // console.log('notifyAjax', {notifications: notifications});
      notifications = Object.assign({}, notifications);

      ajax({
        url: api_users + '/' + userid,
        method: "PUT",
        data: JSON.stringify({notifications: notifications}),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + me.jwt
        },
      }).done(function (data) {
        // console.log(data.username);
        // console.log(data.notifications);
      }).fail(function(error) {
        if (error.statusText === 'abort') {
          // console.log('abort', error);
        } else {
          console.error(JSON.parse(error.responseText||'{}'));
        }
      });
    };



//
// Theme Switcher
//
var set_dark = function() {
    $('body').removeClass('is-light').addClass('is-dark');
    $('.js__theme-switch .material-icons').text('wb_sunny');
    localStorage.theme = 'dark';
  },

  set_light = function() {
    $('body').removeClass('is-dark').addClass('is-light');
    $('.js__theme-switch .material-icons').text('brightness_4');
    localStorage.theme = 'light';
  },

  switch_theme = function() {
    var dataLayerProps = {};

    if (localStorage.theme) {
      if (localStorage.theme === 'dark') {
        dataLayerProps.action = 'set_light';
        set_light();
      } else {
        dataLayerProps.action = 'set_dark';
        set_dark();
      }
    } else {
      dataLayerProps.action = 'set_light';
      set_light();
    }

    send_datalayer('switch_theme', dataLayerProps);
  },

  set_default_theme = function() {
    if (localStorage.theme && localStorage.theme === 'dark') {
      set_dark();
    } else {
      set_light();
    }
  };



var auth_beforeLogin = function() {
      $afterLogin.removeClass('active');
      $beforeLogin.addClass('active');
    },

    auth_afterLogin = function() {
      set_default_theme();

      $beforeLogin.removeClass('active');
      $afterLogin.addClass('active');

      itemField_add();

      // Load All Tasks
      load_tasks();
    },

    auth_updateMe   = function(data) {
      // console.warn('auth_updateMe', data);

      localStorage.setItem('me', JSON.stringify(data));
      me = data;

      // Send Login data to GTM
      var dataLayerProps = {};
      dataLayerProps.action = 'login';
      dataLayerProps.user_id = me.user.id;
      send_datalayer('auth_updateMe', dataLayerProps);

      // Changes something in UI
      auth_uiEffects();
    },

    auth_uiEffects = function() {
      // Show username in Header
      nav_showUsername();

      // Show Notifications
      notifyShow();
    },

    nav_showUsername = function() {
      var html = '<a href="#@'+ me.user.username +'" data-type="assign" data-id="' + me.user.id + '" data-title="@'+ me.user.username +'">@'+ me.user.username +'</a>';
      $me.html('(' + html + ')');
    },

    auth_getMe      = function() {
      if (localStorage.me) {
        me = JSON.parse(localStorage.me||'{}');

        if (me.jwt) {
          // Changes something in UI
          auth_uiEffects();

          return me;
        }
      }

      // console.warn('auth_getMe', 'User isn\'t login.');
      return false;
    },

    auth_logout = function() {
      var dataLayerProps = {};
      dataLayerProps.action = 'logout';
      dataLayerProps.user_id = me.user.id;
      send_datalayer('auth_logout', dataLayerProps);

      localStorage.removeItem('me');
      localStorage.removeItem('users');
      localStorage.removeItem('tags');

      $me.text('');
      auth_beforeLogin();
    },

    auth_login = function($form) {
      var username = $form.find('[name="username"]').val(),
          password = $form.find('[name="password"]').val();

      if ((username === '') || (password === '')) {
        var dataLayerProps = {};
        dataLayerProps.action = 'login-empty';
        send_datalayer('auth_login', dataLayerProps);

        alert('Username or Password is empty!');
        return false;
      }

      ajax({
        url: api_login,
        method: "POST",
        data: JSON.stringify({
          "identifier": username,
          "password": password,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }).done(function (data) {
        auth_updateMe(data);
        auth_afterLogin();
      }).fail(function(error) {
        if (error.statusText === 'abort') {
          // console.log('abort', error);
        } else {
          console.error(JSON.parse(error.responseText||'{}'));
        }

        var dataLayerProps = {};
        dataLayerProps.action = 'login-failed';
        send_datalayer('auth_login', dataLayerProps);
        
        alert('username or password is wrong, try again.');
      });
    },

    auth_getMeData = function() {
      ajax({
        url: api_users + '/' + me.user.id,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + me.jwt
        },
      }).done(function (data) {
        // console.log('auth_getMeData', data);
        auth_updateMe({
          jwt: me.jwt,
          user: data
        });
      }).fail(function(error) {
        if (error.statusText === 'abort') {
          // console.log('abort', error);
        } else {
          console.error(JSON.parse(error.responseText||'{}'));
        }
      });
    };




//
// Init App
//

$(function() {
  if (auth_getMe()) {
    auth_getMeData();
    auth_afterLogin();
  } else {
    auth_beforeLogin();
  }

  if (isPortraiteMobile) {
    $('body').removeClass('desktop');
    $('body').addClass('mobile');
  } else {
    $('body').removeClass('mobile');
    $('body').addClass('desktop');
  }



  //
  // Events
  //


  //
  // Theme Switcher
  //

  $('body').on('click', '.js__theme-switch', function(e){
    e.preventDefault();
    switch_theme();
  });


  //
  // Authentication
  //

  $('body').on('click', '#auth-login', function(e){
    e.preventDefault();
    auth_login($(this).parents('form'));
  });

  $('body').on('click', '#auth-logout', function(e){
    e.preventDefault();
    auth_logout();
  });




  //
  // Title Events
  //

  // Toggle Done
  $('body').on('click', '.js__title', function(e){
    var el = e,
      item = this;

    item_timer = setTimeout(function() {
      if (!item_prevent) {
        item_toggleDone(el, item);
      }
      item_prevent = false;
    }, item_delay);
  });

  // Enable Edit Mode
  $('body').on('dblclick', '.js__todo .js__title', function(e){
    var el = e,
      item = this;

    clearTimeout(item_timer);
    item_prevent = true;

    if ($(item).parent('.js__todo').attr('data-state') === 'todo') {
      item_openEditMode(item);
    }
  });

  // Edit Mode action
  $('body').on('keydown', '#editable-title ' + '.' + itemField_name, function(e){
    var $this = $(this),
      currentTitle  = $this.attr('data-currentTitle'),
      newTitle      = $this.val(),
      id            = $this.attr('data-id');

    if (validate_exitKey(e)) { // Esc Key
      item_exitEditMode();
    } else if (validate_submitKey(e)) { // Enter Key
      if (currentTitle !== newTitle) { // Check Title changed
        item_saveEditMode(id, newTitle)
      } else {
        item_exitEditMode();
      }
    }
  });

  // Delete Item
  $('body').on('click', '#clear-it', function(e){
    e.preventDefault();

    var $parent = $(this).parent('.js__todo'),
      id = $parent.attr('data-id');

    if ($parent.attr('data-state') == 'done') {
      delete_item(id);
    } else {
      confirm_box('Delete this task?', 'Yes, delete it', false, 'data-delete', id);
      // console.warn('question', 'yes text', 'no text', 'callback');
    }
  });

  // Delete Task
  $('body').on('click', '[data-delete]', function(e){
    e.preventDefault();
    var id = $(this).attr('data-delete');
    delete_item(id);
  });



  //
  // Tag Events
  //

  // Open Tag
  $('body').on('click', '[data-type="tags"], [data-type="assign"], [data-type="' + noMentions + '"]', function(e){
    e.preventDefault();

    var id    = $(this).attr('data-id'),
      title = $(this).attr('data-title'),
      type  = $(this).attr('data-type');

    if (type === noMentions) { // !Mentions
      var params = {};
      params['assign_null'] = 'true';
      load_tasks({params: params});

      $pageTitle.attr('data-type', '').attr('data-id', '').attr('data-title', '').text(title);
    } else if (type && id) {
      var params = {};
      params[type + '_in'] = id;
      load_tasks({params: params});

      $pageTitle.attr('data-type', type).attr('data-id', id).attr('data-title', title).text(title);
    } else {
      // Load First List
      load_tasks();

      if (title) {
        $pageTitle.attr('data-type', '').attr('data-id', '').attr('data-title', '').text(title);
      }
    }
  });


  // Close Add New Subject
  $('body').on('click', '.modal-close, #modal-no, #modal-yes, #close-subject', function(e){
    e.preventDefault();

    $(this).parents('.modal').removeClass('active');
  });



  //
  // Add New Subject
  //

  // $('body').on('click', '.' + itemField_name, function(e) {
  //   _setCarretPosition('todo-new-subject-text');
  // });

  // Create it
  $('body').on('keydown', '#todo-new-subject .' + itemField_name, function(e){
    var $this = $(this);

    if (validate_submitKey(e)) {
      var newSubejctStr = $this.val();

      if (newSubejctStr && newSubejctStr !== '') {
        add_item(newSubejctStr);
        itemField_add();
      }
    } else if (validate_exitKey(e)) {
      add_exit();
    }
  });

  $('body').on('click', '.js__show-add-modal', function(){
    $('#modal-add-item').addClass('active');
    $('#modal-add-item .js__add-item-autocomplete').focus();
  });

  $('body').on('click', '#submit-subject', function(){
    var $this = $(this),
        $textarea = $this.parents('#modal-add-item').find('.' + itemField_name),
        newSubejctStr = $textarea.val();

      if (newSubejctStr && newSubejctStr !== '') {
        add_item(newSubejctStr);
        add_exit();
      }
  });

  // Focus on it
  var previousDataTitle = '';
  $('body').on('focus', '.' + itemField_name, function(){
    var $this             = $(this),
        value             = ($this.val() ? $this.val().trim() : ''),
        placeholder       = ($this.attr('placeholder') ? $this.attr('placeholder').trim() : ''),
        currentDataTitle  = ($pageTitle.attr('data-title') ? $pageTitle.attr('data-title').trim() : '');

    if ((value === '') || (value === placeholder) || (value === previousDataTitle)) {
      if (currentDataTitle) {
        previousDataTitle = currentDataTitle.trim();
        $this.val(currentDataTitle + ' ');
        return;
      }

      $this.val('');
    }
  });

  // Exit it
  $('body').on('blur', '.' + itemField_name, function(){
    var $this = $(this);

    if ($this.val() === '') {
      add_exit();
    }
  });



  //
  // Focus Mode
  //

  // Open Focus
  $('body').on('click', '#focus-it', function(e){
    e.preventDefault();

    $focusContent.html($(this).parents('.js__todo').find('.js__title').html());
    $focusMode.addClass('active');
  });

  // Exit Focus
  $('body').on('click', '#focus-close', function(e){
    e.preventDefault();

    $focusMode.removeClass('active');
  });

  // Be Focus!
  $('body').on('click', '#focus-content', function(e){
    e.preventDefault();

    // alert('Be focus and don\'t click on links!');
    confirm_box('Be focus and don\'t click here!', false, 'OK', false, false);
  });
});
