import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faAngleDown, faAngleRight, faTimes} from '@fortawesome/free-solid-svg-icons';
import {MODAL_ERROR, MODAL_SUCCESS, MODAL_UPDATE} from "../../resources/constants";

class Modal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            queue: {}
        }
    }

    componentDidUpdate(prevProps){
        const update = this.props.update || {};
        const msg = update.msg || '';

        // Check for unique updates
        if(prevProps.update !== this.props.update && !(msg in update)){
            const queue = Object.assign({}, this.state.queue);
            queue[msg] = {...update, closed: false};
            this.setState({queue});

            const delay = update.delay || 0;
            setTimeout(() => {
                const queue = Object.assign({}, this.state.queue);
                delete queue[msg];
                this.setState({queue});
            }, delay);
        }
    }

    closeModal = (msg) => {
        const queue = Object.assign({}, this.state.queue);
        queue[msg].closed = true;
        this.setState({queue});
    };

    render() {
        const display = Object.keys(this.state.queue).length > 0 ? "" : " display-none";
        return (<div className={"modal-container" + display}>
                { Object.keys(this.state.queue).map( (update) => {
                    // TODO - constant
                    const type = this.state.queue[update].type || 'ERROR';

                    let modalClass = 'modal';
                    switch(type) {
                        case MODAL_ERROR:
                            modalClass += ' modal-fail';
                            break;
                        case MODAL_UPDATE:
                            modalClass += ' modal-update';
                            break;
                        case MODAL_SUCCESS:
                            modalClass += ' modal-success';
                            break;
                        default:
                            throw new Error('Invalid modal update');
                    }

                    if(this.state.queue[update].closed){
                        // User closed modal via onClick
                        return <div></div>;
                    } else {
                        return <div className={modalClass} key={update}>
                            <FontAwesomeIcon className={"float-right hover"}
                                             icon={faTimes}
                                             onClick={() => this.closeModal(update)}/>
                            <p className="word-break">{update}</p>
                        </div>
                    }
                })}
        </div>);
    }
}

export default Modal;

Modal.propTypes = {
    update: PropTypes.object
};