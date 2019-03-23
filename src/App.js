import React, { Component, Fragment } from 'react';
import { debounce } from "debounce";
import firebase from './firebase.js';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      todoList: {},
      todoTitle: '',
      todoText: '',
      selected: 0,
      saved: true,
      initialLoad: true
    };

    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
  }
  
  componentDidMount() {
    // Updating the `todoList` local state attribute when the Firebase Realtime Database data
    // under the '/todoList' path changes.
    this.firebaseRef = firebase.database().ref('/todoList');
    this.firebaseCallback = this.firebaseRef.on('value', (snap) => {
      const values = snap.val();

      if (!values) {
        this.setState({todoList: [], initialLoad: false});
        return;
      }

      const todoList = Object.entries(snap.val()).map(([key, value]) => { return {id: key, value: value}; }).sort((a, b) => {
        return b.value.date - a.value.date;
      });

      const selected = Math.min(this.state.selected, todoList.length - 1);
      const todoTitle = todoList[selected] ? todoList[selected].value.title : '';
      const todoText = todoList[selected] ? todoList[selected].value.text : '';

      this.setState({
        todoList: todoList || [],
        selected: selected || 0,
        todoTitle: todoTitle || '',
        todoText: todoText || '',
        initialLoad: false
      });
    });
  }
  
  componentWillUnmount() {
    // Un-register the listener on '/todoList'.
    this.firebaseRef.off('value', this.firebaseCallback);
    this.updateData.clear();
  }

  handleTitleChange(e) {
    this.setState({todoTitle: e.target.value, saved: false});
    this.updateData();
  }

  handleChange(e) {
    this.setState({todoText: e.target.value, saved: false});
    this.updateData();
  }
  
  updateData = debounce(() => {
    const { selected, todoList, todoTitle, todoText } = this.state;
    this.firebaseRef.child(todoList[selected].id).update({title: todoTitle, text: todoText}, err => {
      if (!err) this.setState({saved: true});
    });
  }, 1500);
  
  // This is triggered when the "Add New Todo" button is clicked.
  handleCreate(e) {
    if (e) e.preventDefault();
    // Add the new todo to Firebase.
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
    const { selected, todoList, todoText } = this.state;

    this.updateData.clear();
    this.firebaseRef.child(todoList[selected].id).update({text: todoText});
    this.setState({selected: index, todoText: todoList[index].value.text});
  }

  render() {
    const { initialLoad, saved, selected, todoList, todoTitle, todoText } = this.state;

    return (
      <div className="App">
        {initialLoad ? null : (
          <Fragment>
            {todoList.length === 0 ? (
              <div className="noNotes">
                <h2>
                  You don't have any notes yet.
                  <br/>
                  Click the plus button to get started.
                </h2>
                <div className="icon">⬇</div>
              </div>
            ) : (
              <Fragment>
                <div className="column left">
                  <div className="dates">
                    {todoList ? Object.entries(todoList).map(([index, item]) => {
                      index = Number.parseInt(index);
                      return <div className={"item" + (selected === index ? " selected" : "")} key={index}>
                        <button className="date" onClick={() => this.select(index)}>{selected === index ? todoTitle : item.value.title}</button>
                        <button className="delete" onClick={() => this.delete(item.id)}>X</button>
                      </div>
                    }) : null}
                  </div>
                </div>
        
                <div className="column right">
                  <div>
                    <h3>
                      <input className="title" type="text" value={todoTitle} onChange={this.handleTitleChange}/>
                      <span className={"saved" + (saved ? "" : " hidden")}>✓</span>
                    </h3>
                  </div>
                  <textarea value={todoText} onChange={this.handleChange}/>
                </div>
              </Fragment>
            )}
  
            <button className={"button" + (todoList.length === 0 ? " glow" : "")} onClick={this.handleCreate}>+</button>
          </Fragment>
        )}
      </div>
    );
  }
}

export default App;
