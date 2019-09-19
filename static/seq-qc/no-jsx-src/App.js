var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// import React from 'react';
// import './index.css';

import ProjectRouter from './project_router.js';
import Project from './Project.js';
import GET_RECENT_DELIVERIES_RESP from './getRecentDeliveries.js';

var App = function (_React$Component) {
  _inherits(App, _React$Component);

  function App(props) {
    _classCallCheck(this, App);

    var _this = _possibleConstructorReturn(this, (App.__proto__ || Object.getPrototypeOf(App)).call(this, props));

    _this.state = {
      activeProjects: [],
      reviewProjects: []
    };
    return _this;
  }

  _createClass(App, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.init();
    }
  }, {
    key: 'init',
    value: function init() {
      this.setProjectState();
    }

    /**
     * Sets component state to track projects
     */

  }, {
    key: 'setProjectState',
    value: function setProjectState() {
      var projectResp = this.getProjects();
      var projects = this.processProjectResponse(projectResp);

      var activeProjects = projects[0].map(function (p) {
        return new Project(p.pi, p.requestType, p.requestId, p.run, p.date);
      });
      var reviewProjects = projects[1].map(function (p) {
        return new Project(p.pi, p.requestType, p.requestId, p.run, p.date);
      });

      this.setState({ activeProjects: activeProjects, reviewProjects: reviewProjects });
    }

    /**
     * Returns if a project is ready, which is true if none of its samples have 'basicQcs' entries
     *
     * @param project, Object - Project entry taken directly from response
     */

  }, {
    key: 'isProjectReady',
    value: function isProjectReady(project) {
      var samples = project['samples'] || [];
      if (samples.length == 0) return false;

      // Check all samples to see if any have a non-empty basicQcs field, which indicates the project is not ready
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = samples[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var sample = _step.value;

          if (sample['basicQcs'] && sample['basicQcs'].length === 0) {
            return false;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return true;
    }

    //
    /**
     * Based on the basicQcs::qcStatus of each sample. Only one sample in the project needs to be under-review to be un-reviewed
     *
     * @param project, Object - Project entry taken directly from response
     * @returns {boolean}
     */

  }, {
    key: 'isUreviewed',
    value: function isUreviewed(project) {
      var samples = project['samples'] || [];

      var basicQcs = void 0,
          isUnreviewed = void 0;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = samples[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var sample = _step2.value;

          basicQcs = sample['basicQcs'] || [];
          isUnreviewed = basicQcs.reduce(function (isUnderReview, basicQc) {
            return isUnderReview || basicQc['qcStatus'] && basicQc['qcStatus'] === 'Under-Review';
          }, false);
          if (isUnreviewed) return true;
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return false;
    }

    /**
     * Returns recent runs and most date of the most recent sample
     *
     * @param project, Object - Project entry taken directly from response
     * @returns {[*, number]}
     */

  }, {
    key: 'getRunsAndRecentDate',
    value: function getRunsAndRecentDate(project) {
      var samples = project['samples'] || [];
      var runs = new Set([]);
      var recentDate = 0;
      var basicQcs = void 0;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = samples[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var sample = _step3.value;

          basicQcs = sample['basicQcs'] || [];
          var run = void 0;
          var _iteratorNormalCompletion4 = true;
          var _didIteratorError4 = false;
          var _iteratorError4 = undefined;

          try {
            for (var _iterator4 = basicQcs[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
              var qc = _step4.value;

              run = qc['run'] || '';
              var matches = run.match('([A-Z|0-9]+_[0-9]+)');
              var trimmed = matches[0];
              runs.add(trimmed);
              if (qc['createDate'] > recentDate) {
                recentDate = qc['createDate'];
              }
            }
          } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion4 && _iterator4.return) {
                _iterator4.return();
              }
            } finally {
              if (_didIteratorError4) {
                throw _iteratorError4;
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      return [Array.from(runs), recentDate];
    }

    /**
     * Sends service call to retrieve most recent deliveries
     *
     */

  }, {
    key: 'getProjects',
    value: function getProjects() {
      /*
       TODO - Don't mock
      */
      return GET_RECENT_DELIVERIES_RESP;
    }

    /**
     * Enriches project response with fields for categorizing each project
     *
     * @param projects
     * @returns {[[], []]}
     */

  }, {
    key: 'processProjectResponse',
    value: function processProjectResponse(projects) {
      var review_projects = [];
      var active_projects = [];
      var runs = void 0,
          recentDate = void 0,
          projectReady = void 0;
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = projects[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var project = _step5.value;

          projectReady = this.isProjectReady(project);
          project['ready'] = projectReady;

          if (this.isUreviewed(project)) {
            review_projects.push(project);
          } else {
            active_projects.push(project);
          }

          var _getRunsAndRecentDate = this.getRunsAndRecentDate(project);

          var _getRunsAndRecentDate2 = _slicedToArray(_getRunsAndRecentDate, 2);

          runs = _getRunsAndRecentDate2[0];
          recentDate = _getRunsAndRecentDate2[1];

          project['run'] = runs.join(', ');
          project['ordering'] = recentDate;

          // TODO - project['date'] = time.strftime('%Y-%m-%d %H:%M', time.localtime((recentDate/1000)))
          project['date'] = recentDate;
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      review_projects.sort(function (p1, p2) {
        return p1['ordering'] - p2['ordering'];
      });
      active_projects.sort(function (p1, p2) {
        return p1['ordering'] - p2['ordering'];
      });

      return [review_projects, active_projects];
    }
  }, {
    key: 'render',
    value: function render() {
      /* <ProjectRouter name="Recent Deliveries" projects={this.state.projects}/> */
      return React.createElement(
        'div',
        { className: 'router-container' },
        React.createElement(ProjectRouter, { name: 'Needs Review', projects: this.state.reviewProjects }),
        React.createElement(ProjectRouter, { name: 'Requires Further Sequencing', projects: this.state.activeProjects })
      );
    }
  }]);

  return App;
}(React.Component);

export default App;