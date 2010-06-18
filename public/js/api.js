(function(){
  window.API = {
    services: {
      zemanta: {
        box: 'Enter a block of text:',
        description: 'Zemanta is a service that finds names, locations, photos, links and other material based on a raw chunk of text.',
        mode: 'text'
      },
      truveo: {
        box: 'Enter video keywords:',
        description: 'Truveo is a huge database of online videos.',
        mode: 'line'
      },
      opencongress: {
        box: 'Enter the last name of a Member of Congress:',
        description: 'A general resource on Congress, produced by the Participatory Politics Foundation and the Sunlight Foundation.',
        mode: 'line'
      },
      guardian: {
        box: 'Enter anything that might appear in a story:',
        description: 'This API lets you mine The Guardian\'s article database.',
        mode: 'line'
      },
      oilreporter: {
        box: '',
        description: 'Oil Reporter is a new effort to crowdsource oil sightings along the Gulf coast.',
        mode: 'none'
      },
      twitter: {
        box: 'Enter something to search for on Twitter:',
        description: 'How might you mine the Twitterverse? With Twitter\'s API.',
        mode: 'line'
      }
    },
    initialize: function() {
      $('#go').click(API.go);
      $('#picker').bind('change', API.change);
      $('#line').keypress(function(e) {
        if (e.keyCode === 13) {
          return API.go();
        }
      });
      return API.change('guardian');
    },
    change: function(service) {
      var api;
      service = _.isString(service) ? service : $('#picker').val();
      api = API.services[service];
      API.current = api;
      document.body.className = ("" + (api.mode) + "_mode");
      $('#box_label').html(api.box);
      $('#description').html(api.description);
      $('#results').html('');
      return API.getInput().focus();
    },
    go: function() {
      var api;
      api = $('#picker').val();
      return API.fetch(api, API.getInput().val());
    },
    getInput: function() {
      if (API.current.mode === 'text') {
        return $('#text');
      } else {
        return $('#line');
      }
    },
    render: function(data) {
      return $('#results').html(API.table(data));
    },
    fetch: function(api, value) {
      $.getJSON(("/api/" + (api) + ".json"), {
        text: value
      }, API[("" + (api) + "Complete")]);
      return $('#spinner').show();
    },
    zemantaComplete: function(response) {
      var articles, images, keywords;
      $('#spinner').hide();
      images = {
        title: "Images",
        headers: ["Description", "Image"],
        rows: _.map(response.images, function(image) {
          return [image.description, ("<img src='" + image.url_m + "' width='" + image.url_m_w + "' height='" + image.url_m_h + "' />")];
        })
      };
      articles = {
        title: "Articles",
        headers: ["Title", "Link", "Publication Date"],
        rows: _.map(response.articles, function(article) {
          return [
            article.title, {
              url: article.url,
              text: article.url
            }, article.published_datetime
          ];
        })
      };
      keywords = {
        title: "Keywords",
        headers: ["Keyword", "Confidence"],
        rows: _.map(response.keywords, function(keyword) {
          return [keyword.name, keyword.confidence];
        })
      };
      return API.render({
        tables: [images, articles, keywords]
      });
    },
    truveoComplete: function(response) {
      var videos;
      $('#spinner').hide();
      videos = {
        title: "Videos",
        headers: ["Title", "Channel", "Description", "Video"],
        rows: _.map(response.response.data.results.videoSet.videos, function(video) {
          return [video.title, video.channel, video.description, video.videoPlayerEmbedTag];
        })
      };
      return API.render({
        tables: [videos]
      });
    },
    opencongressComplete: function(response) {
      var articles, news, people;
      $('#spinner').hide();
      people = {
        title: "Members of Congress",
        headers: ["Name", "Website", "Phone", "Office", "Religion"],
        rows: _.map(response.people, function(person) {
          return [
            person.name, {
              url: person.website,
              text: person.website
            }, person.phone, person.congress_office, person.religion
          ];
        })
      };
      news = _.flatten(_.map(response.people, function(person) {
        return person.recent_news;
      }));
      articles = {
        title: "Articles",
        headers: ["Title", "Source", "Excerpt", "Link"],
        rows: _.map(news, function(article) {
          return [
            article.title, article.source, article.excerpt, {
              url: article.url,
              text: article.url
            }
          ];
        })
      };
      return API.render({
        tables: [people, articles]
      });
    },
    guardianComplete: function(response) {
      var articles;
      $('#spinner').hide();
      articles = {
        title: "Articles",
        headers: ["Title", "Section", "Excerpt", "Link"],
        rows: _.map(response.response.results, function(article) {
          return [
            article.webTitle, article.sectionName, article.fields.trailText + '...', {
              url: article.webUrl,
              text: article.webUrl
            }
          ];
        })
      };
      return API.render({
        tables: [articles]
      });
    },
    oilreporterComplete: function(response) {
      var reports;
      $('#spinner').hide();
      reports = {
        title: "Reports",
        headers: ["Description", "Wildlife", "Oil", "Lat/Lng", "Date"],
        rows: _.map(response, function(report) {
          return [report.description, report.wildlife, report.oil, report.latitude + ' / ' + report.longitude, report.created_at];
        })
      };
      return API.render({
        tables: [reports]
      });
    },
    twitterComplete: function(response) {
      var tweets;
      $('#spinner').hide();
      tweets = {
        title: "Tweets",
        headers: ["User", "Picture", "Tweet"],
        rows: _.map(response.results, function(tweet) {
          return [tweet.from_user, "<img width='48' height='48' src='" + tweet.profile_image_url + "' />", tweet.text];
        })
      };
      return API.render({
        tables: [tweets]
      });
    },
    table: _.template("<% _.each(tables, function(table) { %>\n  <h3><%= table.title %></h3>\n  <table>\n    <thead>\n      <tr>\n        <% _.each(table.headers, function(header) { %>\n          <th><%= header %></th>\n        <% }); %>\n      </tr>\n    </thead>\n    <tbody>\n      <% _.each(table.rows, function(row) { %>\n        <tr>\n          <% _.each(row, function(col) { %>\n            <td class=\"col\">\n            <% if (col && col.url) { %>\n              <a href=\"<%= col.url %>\" target=\"_blank\"><%= col.text %></a>\n            <% } else { %>\n              <%= col %>\n            <% } %>\n            </td>\n          <% }); %>\n        </tr>\n      <% }); %>\n    </tbody>\n  </table>\n<% }); %>")
  };
  $(API.initialize);
})();