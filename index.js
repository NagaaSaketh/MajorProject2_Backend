const { initialiseDB } = require("./db/db.connect");
const express = require("express");
const cors = require("cors");

const SalesAgent = require("./models/agents.model");
const Lead = require("./models/lead.model");
const Comment = require("./models/comment.model");
const Tag = require("./models/tag.model");

const app = express();

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json());

initialiseDB();

app.get("/", (req, res) => {
  res.send("Anvaya Backend");
});

// Function to create a new sales agent.

async function createAgent(newAgent) {
  try {
    const agent = new SalesAgent(newAgent);
    const savedAgent = await agent.save();
    return savedAgent;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// Simple function to validate the email address.

function isValidEmail(email) {
  return email && email.includes("@") && email.includes(".");
}

// API route to create a new sales agent.

app.post("/agents", async (req, res) => {
  const { email } = req.body;

  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Please enter a valid email address" });
    return;
  }
  try {
    const existingAgent = await SalesAgent.findOne({ email: email });
    if (existingAgent) {
      res
        .status(409)
        .json({ error: `Sales agent with email ${email} already exists.` });
      return;
    }

    const newAgent = await createAgent(req.body);

    if (newAgent) {
      res.status(201).json(newAgent);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to create sales agent" });
  }
});

// Function to get all the sales agents

async function readAllAgents() {
  try {
    const agents = SalesAgent.find();
    return agents;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// API route to get all the agents from db.

app.get("/agents", async (req, res) => {
  try {
    const salesAgents = await readAllAgents();
    if (salesAgents.length != 0) {
      res.status(200).json(salesAgents);
    } else {
      res.status(404).json({ error: "No sales agents found." });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sales agents." });
  }
});

// Function to create a new lead
async function createLead(newLead) {
  try {
    const lead = new Lead(newLead);
    const savedLead = await lead.save();
    return savedLead;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// API route to post a new lead

app.post("/leads", async (req, res) => {
  const { name, source, salesAgent, status, timeToClose, priority } = req.body;

  if (!name) {
    res.status(400).json({ error: "Invalid input: 'name' is required." });
    return;
  }
  if (!source) {
    res.status(400).json({ error: "Invalid input: 'source' is required." });
    return;
  }
  if (!salesAgent) {
    res.status(400).json({ error: "Invalid input: 'salesAgent' is required." });
    return;
  }
  if (!status) {
    res.status(400).json({ error: "Invalid input: 'status' is required." });
    return;
  }
  if (!timeToClose) {
    res
      .status(400)
      .json({ error: "Invalid input: 'timeToClose' is required." });
    return;
  }
  if (!priority) {
    res.status(400).json({ error: "Invalid input: 'priority' is required." });
    return;
  }
  try {
    const existingAgent = await SalesAgent.findOne({ _id: salesAgent });
    if (!existingAgent) {
      res
        .status(404)
        .json({ error: `Sales agent with ID ${salesAgent}  not found.` });
      return;
    }
    const lead = await createLead(req.body);
    const populatedLead = await Lead.findById(lead._id).populate(
      "salesAgent",
      "name"
    );
    if (populatedLead) {
      res.status(201).json(populatedLead);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to create lead" });
  }
});

// Function to get all the leads

async function readAllLeads(filters = {}) {
  try {
    const leads = await Lead.find(filters).populate("salesAgent", "name");
    return leads;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// API route to get all the leads from db.

app.get("/leads", async (req, res) => {
  try {
    const { salesAgent, status, tags, source } = req.query;

    let filters = {};

    if (salesAgent) {
      const agent = await SalesAgent.findOne({ name: salesAgent });
      if (!agent) {
        return res.status(404).json({ error: "Agent not found." });
      }
      filters.salesAgent = agent._id;
    }
    const validStatuses = [
      "New",
      "Contacted",
      "Qualified",
      "Proposal Sent",
      "Closed",
    ];
    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid input: 'status' must be one of ${validStatuses}.`,
        });
      }
      filters.status = status;
    }
    const validSources = [
      "Website",
      "Referral",
      "Cold Call",
      "Advertisement",
      "Email",
      "Other",
    ];
    if (source) {
      if (!validSources.includes(source)) {
        return res.status(400).json({
          error: `Invalid input: 'source' must be one of ${validSources}.`,
        });
      }
      filters.source = source;
    }
    if (tags) {
      const tagArray = tags.split(",").map((tag) => tag.trim());
      filters.tags = { $all: tagArray };
    }

    const leads = await readAllLeads(filters);
    if (leads.length != 0) {
      res.status(200).json(leads);
    } else {
      res.status(404).json({ error: "No leads found." });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leads." });
  }
});

// Function to get a lead by its ID.

async function getLead(id) {
  try {
    const lead = await Lead.findById(id).populate("salesAgent", "name");
    return lead;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// API route to get the details of a particular lead.

app.get("/lead/:id", async (req, res) => {
  try {
    const lead = await getLead(req.params.id);
    if (lead) {
      res.json(lead);
    } else {
      res.status(404).json({ error: "No lead found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lead details" });
  }
});

// Function to update a lead by its ID.

async function updateLead(id, data) {
  try {
    const lead = await Lead.findByIdAndUpdate(id, data, { new: true }).populate(
      "salesAgent",
      "name"
    );
    return lead;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// API route to update a lead in db.

app.put("/leads/:id", async (req, res) => {
  const { name, source, salesAgent, status, timeToClose, priority } = req.body;

  if (!name) {
    res.status(400).json({ error: "Invalid input: 'name' is required." });
    return;
  }
  if (!source) {
    res.status(400).json({ error: "Invalid input: 'source' is required." });
    return;
  }
  if (!salesAgent) {
    res.status(400).json({ error: "Invalid input: 'salesAgent' is required." });
    return;
  }
  if (!status) {
    res.status(400).json({ error: "Invalid input: 'status' is required." });
    return;
  }
  if (!timeToClose) {
    res
      .status(400)
      .json({ error: "Invalid input: 'timeToClose' is required." });
    return;
  }
  if (!priority) {
    res.status(400).json({ error: "Invalid input: 'priority' is required." });
    return;
  }
  try {
    const leadId = req.params.id;
    const updatedLead = await updateLead(leadId, req.body);
    if (updatedLead) {
      res.status(200).json(updatedLead);
    } else {
      res.status(404).json({ error: `Lead with ID ${leadId} not found.` });
      return;
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to update the lead." });
  }
});

// Function to delete a lead by its ID.

async function deleteLead(id) {
  try {
    const lead = await Lead.findByIdAndDelete(id);
    return lead;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// API route to delete a lead from db.

app.delete("/leads/:id", async (req, res) => {
  const leadID = req.params.id;
  try {
    const lead = await deleteLead(leadID);
    if (lead) {
      res.status(200).json({ message: "Lead deleted successfully." });
    } else {
      res.status(404).json({ error: `Lead with ID ${leadID} not found.` });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to delete a lead." });
  }
});

// Function to create a comment for lead.

async function createComment(commentData) {
  try {
    const newComment = new Comment(commentData);
    const savedComment = await newComment.save();
    return savedComment;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// API route to create a comment to a lead.

app.post("/leads/:id/comments", async (req, res) => {
  try {
    const leadID = req.params.id;
    const { commentText } = req.body;
    const existingLead = await Lead.findById(leadID).populate("salesAgent");
    if (!existingLead) {
      res.status(404).json({ error: `Lead with ID ${leadID} not found.` });
      return;
    }
    const commentData = {
      lead: leadID,
      author: existingLead.salesAgent._id,
      commentText: commentText.trim(),
    };
    const comment = await createComment(commentData);
    const populatedComment = await Comment.findById(comment._id).populate(
      "author",
      "name"
    );

    const response = {
      id: populatedComment._id,
      commentText: populatedComment.commentText,
      author: populatedComment.author?.name,
      createdAt: populatedComment.createdAt,
    };
    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ error: "Failed to create a comment." });
  }
});

// Function to get all the comments for a lead.

async function getAllComments(leadId) {
  try {
    const comments = await Comment.find({ lead: leadId }).populate(
      "author",
      "name"
    );
    return comments;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// API route to retrieve all the comments for a lead.

app.get("/leads/:id/comments", async (req, res) => {
  try {
    const leadID = req.params.id;

    const existingLead = await Lead.findById(leadID);

    if (!existingLead) {
      res.status(404).json({ error: `Lead with ID ${leadID} not found.` });
      return;
    }

    const comments = await getAllComments(leadID);

    const allComments = comments.map((comment) => ({
      id: comment._id,
      commentText: comment.commentText,
      author: comment.author.name,
      createdAt: comment.createdAt,
    }));
    if (allComments) {
      res.status(200).json(allComments);
    } else {
      res.status(404).json({ error: "No comments found." });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Function to get the leads with " status:closed ".

async function closedLeads() {
  try {
    const leads = await Lead.find({status: "Closed"}).populate("salesAgent", "name");
    return leads;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// API route to get all the leads with "status:closed"

app.get("/report/last-week", async (req, res) => {
  try {
    const leads = await closedLeads();

    const response = leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      salesAgent: lead.salesAgent?.name,
      closedAt: lead.closedAt,
    }));

    if (response.length != 0) {
      res.status(200).json(response);
    } else {
      res.status(404).json({ error: "No closed leads found." });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch closed leads." });
  }
});

// Function to get the total no. of leads in the pipeline.

async function totalLeads() {
  const leads = await Lead.find();
  try {
    const totalLeadsInPipeline = leads.reduce((acc, curr) => {
      if (curr.status !== "Closed") {
        return acc + 1;
      }
      return acc;
    }, 0);
    return totalLeadsInPipeline;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// API routes to leads that are in pipeline.

app.get("/report/pipeline", async (req, res) => {
  try {
    const totalLeadsInPipeline = await totalLeads();
    const response = {
      totalLeadsInPipeline: totalLeadsInPipeline,
    };
    if (response) {
      res.status(200).json(response);
    } else {
      res.status(404).json({ error: "Pipeline is empty." });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch the pipeline leads." });
  }
});

// Function to get the number of leads closed by each sales agent.

async function leadsClosedByEachAgent() {
  try {
    const leads = await Lead.find({ status: "Closed" }).populate(
      "salesAgent",
      "name"
    );
    const leadsClosedByAgents = leads.reduce((acc, curr) => {
      if (curr.salesAgent) {
        const agentId = curr.salesAgent._id;
        const agentName = curr.salesAgent.name;
        if (acc[agentId]) {
          acc[agentId].count += 1;
        } else {
          acc[agentId] = {
            agentName: agentName,
            count: 1,
          };
        }
      }
      return acc;
    }, {});
    const result = Object.values(leadsClosedByAgents);
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// API route to get leads closed by each agent.

app.get("/report/closed-by-agent", async (req, res) => {
  try {
    const leadsGroupedByAgent = await leadsClosedByEachAgent();

    res.status(200).json(leadsGroupedByAgent);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leads closed by agent." });
  }
});

// Function to create new tags

async function createTags(newTags) {
  try {
    const tags = new Tag(newTags);
    const savedTags = await tags.save();
    return savedTags;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// API route to post new tags

app.post("/tags", async (req, res) => {
  const { name } = req.body;
  try {
    const existingTag = await Tag.findOne({ name: name });
    if (existingTag) {
      res.status(400).json({ error: `${name} already exists.` });
      return;
    }
    const tags = await createTags({ name: name });
    if (tags) {
      res.status(201).json(tags);
    } else {
      res.status(400).json({ error: "Please enter all the required fields." });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to create tags." });
  }
});

// Function to get all the tags

async function readAllTags() {
  try {
    const tags = await Tag.find();
    return tags;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// API route to get all the tags

app.get("/tags", async (req, res) => {
  try {
    const tags = await readAllTags();
    if (tags.length != 0) {
      res.status(200).json(tags);
    } else {
      res.status(404).json({ error: "No Tags found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tags." });
  }
});

const PORT = 3000;

app.listen(PORT, () => console.log("Server is running on", PORT));
