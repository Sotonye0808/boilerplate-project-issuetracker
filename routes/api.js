'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const issueSchema = new Schema({
  project: { type: String, required: true },
  issue_title: { type: String, required: true },
  issue_text: { type: String, required: true },
  created_by: { type: String, required: true },
  assigned_to: { type: String, default: '' },
  status_text: { type: String, default: '' },
  open: { type: Boolean, default: true },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now }
});


const Issue = mongoose.model('Issue', issueSchema);

module.exports = function (app) {

  app.route('/api/issues/:project')
  .get(async function (req, res) {
    const project = req.params.project;
    const filter = { project, ...req.query };

    try {
      const issues = await Issue.find(filter).exec();
      res.json(issues);
    } catch (err) {
      res.status(500).send('Error fetching issues');
    }
  })
  .post(async function (req, res) {
    const project = req.params.project;
    const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

    if (!issue_title || !issue_text || !created_by) {
      return res.json({ error: 'required field(s) missing' });
    }

    const newIssue = new Issue({
      project,
      issue_title,
      issue_text,
      created_by,
      assigned_to: assigned_to || '',
      status_text: status_text || ''
    });

    try {
      const savedIssue = await newIssue.save();
      res.json(savedIssue);
    } catch (err) {
      res.status(500).send('Error saving issue');
    }
  })
  .put(async function (req, res) {
    const { _id, ...updateFields } = req.body;

    if (!_id) {
      return res.json({ error: 'missing _id' });
    }

    const updateData = Object.fromEntries(Object.entries(updateFields).filter(([_, v]) => v != null));

    if (Object.keys(updateData).length === 0) {
      return res.json({ error: 'no update field(s) sent', '_id': _id });
    }

    updateData.updated_on = new Date();

    try {
      const updatedIssue = await Issue.findByIdAndUpdate(_id, updateData, { new: true }).exec();
      if (!updatedIssue) {
        return res.json({ error: 'could not update', '_id': _id });
      }
      res.json({ result: 'successfully updated', '_id': _id });
    } catch (err) {
      res.json({ error: 'could not update', '_id': _id });
    }
  })
  .delete(async function (req, res) {
    const { _id } = req.body;

    if (!_id) {
      return res.json({ error: 'missing _id' });
    }

    try {
      const deletedIssue = await Issue.findByIdAndDelete(_id).exec();
      if (!deletedIssue) {
        return res.json({ error: 'could not delete', '_id': _id });
      }
      res.json({ result: 'successfully deleted', '_id': _id });
    } catch (err) {
      res.json({ error: 'could not delete', '_id': _id });
    }
  });
};
