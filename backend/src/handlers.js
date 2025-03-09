"use strict";

const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Helper function to format responses with CORS headers
const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
  },
  body: JSON.stringify(body),
});

// POST /register
module.exports.register = async (event) => {
  const data = JSON.parse(event.body);

  if (!data.phone || !data.name) {
    return response(400, { error: "Phone and name are required" });
  }

  const user = {
    id: uuidv4(),
    phone: data.phone,
    name: data.name,
    bio: data.bio || "",
    photoUrl: data.photo || "",
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    createdAt: new Date().toISOString(),
  };

  const params = {
    TableName: process.env.USERS_TABLE,
    Item: user,
  };

  try {
    await dynamoDb.put(params).promise();
    return response(201, { user });
  } catch (error) {
    console.error(error);
    return response(500, { error: "Could not create user" });
  }
};

// POST /update-location
module.exports.updateLocation = async (event) => {
  const data = JSON.parse(event.body);

  if (
    !data.userId ||
    data.latitude === undefined ||
    data.longitude === undefined
  ) {
    return response(400, {
      error: "userId, latitude, and longitude are required",
    });
  }

  const params = {
    TableName: process.env.USERS_TABLE,
    Key: { id: data.userId },
    UpdateExpression: "set latitude = :lat, longitude = :lng",
    ExpressionAttributeValues: {
      ":lat": data.latitude,
      ":lng": data.longitude,
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    const result = await dynamoDb.update(params).promise();
    return response(200, { updated: result.Attributes });
  } catch (error) {
    console.error(error);
    return response(500, { error: "Could not update location" });
  }
};

// GET /users/nearby?lat=&lng=&radius=
module.exports.getNearbyUsers = async (event) => {
  // For production, integrate the DynamoDB Geo Library for efficient geospatial queries.
  const { lat, lng, radius } = event.queryStringParameters;

  const params = {
    TableName: process.env.USERS_TABLE,
  };

  try {
    const result = await dynamoDb.scan(params).promise();
    const users = result.Items.filter((user) => {
      if (user.latitude && user.longitude) {
        const distance =
          Math.sqrt(
            Math.pow(user.latitude - lat, 2) + Math.pow(user.longitude - lng, 2)
          ) * 111139;
        return distance <= parseInt(radius);
      }
      return false;
    });
    return response(200, { users });
  } catch (error) {
    console.error(error);
    return response(500, { error: "Could not fetch nearby users" });
  }
};

// POST /poke
module.exports.sendPoke = async (event) => {
  const data = JSON.parse(event.body);

  if (!data.fromUserId || !data.toUserId) {
    return response(400, { error: "fromUserId and toUserId are required" });
  }

  const poke = {
    id: uuidv4(),
    fromUserId: data.fromUserId,
    toUserId: data.toUserId,
    timestamp: new Date().toISOString(),
    status: "pending",
  };

  const params = {
    TableName: process.env.POKES_TABLE,
    Item: poke,
  };

  try {
    await dynamoDb.put(params).promise();
    return response(201, { poke });
  } catch (error) {
    console.error(error);
    return response(500, { error: "Could not send poke" });
  }
};

// GET /pokes/incoming?userId=
module.exports.getIncomingPokes = async (event) => {
  const { userId } = event.queryStringParameters;

  const params = {
    TableName: process.env.POKES_TABLE,
    FilterExpression: "toUserId = :uid and #status = :pending",
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: { ":uid": userId, ":pending": "pending" },
  };

  try {
    const result = await dynamoDb.scan(params).promise();
    return response(200, { pokes: result.Items });
  } catch (error) {
    console.error(error);
    return response(500, { error: "Could not fetch pokes" });
  }
};

// POST /message
module.exports.sendMessage = async (event) => {
  const data = JSON.parse(event.body);

  if (!data.conversationId || !data.senderId || !data.content) {
    return response(400, {
      error: "conversationId, senderId, and content are required",
    });
  }

  if (data.content.length > 100) {
    return response(400, { error: "Message exceeds 100 characters" });
  }

  const message = {
    id: uuidv4(),
    conversationId: data.conversationId,
    senderId: data.senderId,
    content: data.content,
    timestamp: new Date().toISOString(),
  };

  const params = {
    TableName: process.env.MESSAGES_TABLE,
    Item: message,
  };

  try {
    await dynamoDb.put(params).promise();
    // For a complete implementation, update conversation state and turn logic here.
    return response(201, { message });
  } catch (error) {
    console.error(error);
    return response(500, { error: "Could not send message" });
  }
};

// GET /conversation/{conversationId}/messages
module.exports.getMessages = async (event) => {
  const { conversationId } = event.pathParameters;

  const params = {
    TableName: process.env.MESSAGES_TABLE,
    IndexName: "conversationIndex", // Ensure a Global Secondary Index exists on conversationId
    KeyConditionExpression: "conversationId = :cid",
    ExpressionAttributeValues: {
      ":cid": conversationId,
    },
  };

  try {
    const result = await dynamoDb.query(params).promise();
    return response(200, { messages: result.Items });
  } catch (error) {
    console.error(error);
    return response(500, { error: "Could not fetch messages" });
  }
};
