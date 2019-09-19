var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// TODO - When fully integrated
// import React from 'react';
// import ReactDOM from 'react-dom';
// import PropTypes from 'prop-types';

/**
 * Router for Projects
 */
var ProjectRouter = function (_React$Component) {
    _inherits(ProjectRouter, _React$Component);

    function ProjectRouter(props) {
        _classCallCheck(this, ProjectRouter);

        return _possibleConstructorReturn(this, (ProjectRouter.__proto__ || Object.getPrototypeOf(ProjectRouter)).call(this, props));
    }

    _createClass(ProjectRouter, [{
        key: "renderHeaders",
        value: function renderHeaders() {
            var fields = ["PI", "Type", "Request Id", "Recent Runs", "Date of Latest Stats"];
            return React.createElement(
                "div",
                null,
                fields.map(function (field) {
                    return React.createElement(
                        "div",
                        { className: "project-field" },
                        React.createElement(
                            "p",
                            { className: "font-size-16 font-bold" },
                            field
                        )
                    );
                }),
                " "
            );
        }
    }, {
        key: "renderProjects",
        value: function renderProjects() {
            var projectElements = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.props.projects[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var project = _step.value;

                    var fields = [project.pi, project.requestType, project.requestId, project.run, project.date];
                    var element = React.createElement(
                        "div",
                        { className: "fill-width" },
                        fields.map(function (field) {
                            return React.createElement(
                                "div",
                                { className: "project-field field-header" },
                                React.createElement(
                                    "p",
                                    { className: "font-size-12" },
                                    field
                                )
                            );
                        })
                    );
                    projectElements.push(element);
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

            return React.createElement(
                "div",
                null,
                projectElements
            );
        }
    }, {
        key: "render",
        value: function render() {
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "p",
                        { className: "font-size-24" },
                        this.props.name
                    )
                ),
                this.renderHeaders(),
                this.renderProjects()
            );
        }
    }]);

    return ProjectRouter;
}(React.Component);

export default ProjectRouter;

ProjectRouter.propTypes = {
    name: PropTypes.string,
    projects: PropTypes.array
};