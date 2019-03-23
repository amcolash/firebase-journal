import React, { Component, Fragment } from 'react';
import { debounce } from 'debounce';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faLongArrowAltDown, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import firebase from './firebase.js';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      itemList: {},
      itemTitle: '',
      itemText: '',
      selected: 0,
      saved: true,
      initialLoad: true
    };

    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
  }
  
  componentDidMount() {
    // Updating the `itemList` local state attribute when the Firebase Realtime Database data
    // under the '/itemList' path changes.
    this.firebaseRef = firebase.database().ref('/itemList');
    this.firebaseCallback = this.firebaseRef.on('value', (snap) => {
      const values = snap.val();

      if (!values) {
        this.setState({itemList: [], initialLoad: false});
        return;
      }

      const itemList = Object.entries(snap.val()).map(([key, value]) => { return {id: key, value: value}; }).sort((a, b) => {
        return b.value.date - a.value.date;
      });

      const selected = Math.min(this.state.selected, itemList.length - 1);
      const itemTitle = itemList[selected] ? itemList[selected].value.title : '';
      const itemText = itemList[selected] ? itemList[selected].value.text : '';

      this.setState({
        itemList: itemList || [],
        selected: selected || 0,
        itemTitle: itemTitle || '',
        itemText: itemText || '',
        initialLoad: false
      });
    });
  }
  
  componentWillUnmount() {
    // Un-register the listener on '/itemList'.
    this.firebaseRef.off('value', this.firebaseCallback);
    this.updateData.clear();
  }

  handleTitleChange(e) {
    this.setState({itemTitle: e.target.value, saved: false});
    this.updateData();
  }

  handleTextChange(e) {
    this.setState({itemText: e.target.value, saved: false});
    this.updateData();
  }
  
  updateData = debounce(() => {
    const { selected, itemList, itemTitle, itemText } = this.state;
    this.firebaseRef.child(itemList[selected].id).update({title: itemTitle, text: itemText}, err => {
      if (!err) this.setState({saved: true});
    });
  }, 1500);
  
  // This is triggered when the "Add New item" button is clicked.
  handleCreate(e) {
    if (e) e.preventDefault();
    // Add the new item to Firebase.
    this.firebaseRef.push({
      date: new Date().getTime(),
      title: new Date().toLocaleString(),
      text: '...',
    }, err => {
      if (!err) {
        this.select(Math.max(0, this.state.selected - 1));
      }
    });
  }

  delete(key) {
    this.firebaseRef.child(key).remove();
  }

  select(index) {
    const { selected, itemList, itemText } = this.state;

    this.updateData.clear();
    this.firebaseRef.child(itemList[selected].id).update({text: itemText});
    this.setState({selected: index, itemText: itemList[index].value.text});
  }

  render() {
    const { initialLoad, saved, selected, itemList, itemTitle, itemText } = this.state;

    return (
      <div className="App">
        {initialLoad ? null : (
          <Fragment>
            {itemList.length === 0 ? (
              <div className="noNotes">
                <h2>
                  You don't have any notes yet.
                  <br/>
                  Click the plus button to get started.
                </h2>
                <FontAwesomeIcon icon={faLongArrowAltDown} className="arrow" />
              </div>
            ) : (
              <Fragment>
                <div className="column left">
                  <div className="dates">
                    {itemList ? Object.entries(itemList).map(([index, item]) => {
                      index = Number.parseInt(index);
                      return <div className={"item" + (selected === index ? " selected" : "")} key={index}>
                        <button className="date" onClick={() => this.select(index)}>{selected === index ? itemTitle : item.value.title}</button>
                        <button className="delete" onClick={() => this.delete(item.id)}><FontAwesomeIcon icon={faTrash} /></button>
                      </div>
                    }) : null}
                  </div>
                </div>
        
                <div className="column right">
                  <div>
                    <h3>
                      <input className="title" type="text" value={itemTitle} onChange={this.handleTitleChange}/>
                      {/* <span className={"saved" + (saved ? "" : " hidden")}></span> */}
                      <FontAwesomeIcon icon={faCheck} className={"saved" + (saved ? "" : " hidden")} />
                    </h3>
                  </div>
                  <textarea value={itemText} onChange={this.handleTextChange}/>
                </div>
              </Fragment>
            )}
  
            <button className={"button" + (itemList.length === 0 ? " glow" : "")} onClick={this.handleCreate}>
              <FontAwesomeIcon icon={faPlus}/>
            </button>
          </Fragment>
        )}
      </div>
    );
  }
}

export default App;
