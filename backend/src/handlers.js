"use strict";

const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const JWT_SECRET = process.env.JWT_SECRET || "mysecret";

// Helper function to format responses with CORS headers
const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
  },
  body: JSON.stringify(body),
});

// Helper function to verify JWT token (if needed)
const verifyToken = (event) => {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// POST /login
module.exports.login = async (event) => {
  const data = JSON.parse(event.body);
  const { phone } = data;
  if (!phone) {
    return response(400, { error: "Phone number is required" });
  }
  // Query for user by phone (ensure a Global Secondary Index on phone exists)
  const queryParams = {
    TableName: process.env.USERS_TABLE,
    IndexName: "phone-index",
    KeyConditionExpression: "phone = :phone",
    ExpressionAttributeValues: { ":phone": phone },
  };
  let user;
  try {
    const result = await dynamoDb.query(queryParams).promise();
    if (result.Items.length === 0) {
      // Auto-register the new user with default details
      user = {
        id: uuidv4(),
        phone,
        name: `User-${phone.slice(-4)}`, // default name based on last 4 digits
        bio: "",
        photoUrl: "",
        createdAt: new Date().toISOString(),
      };
      const putParams = {
        TableName: process.env.USERS_TABLE,
        Item: user,
      };
      await dynamoDb.put(putParams).promise();
    } else {
      user = result.Items[0];
    }
    // Generate OTP (for demo purposes, a random 4-digit number)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    // Update user record with OTP (in production, add expiration and more secure handling)
    const updateParams = {
      TableName: process.env.USERS_TABLE,
      Key: { id: user.id },
      UpdateExpression: "set otp = :otp",
      ExpressionAttributeValues: { ":otp": otp },
      ReturnValues: "UPDATED_NEW",
    };
    await dynamoDb.update(updateParams).promise();
    // For demo purposes, return the OTP (in production, send it via SMS)
    return response(200, { message: "OTP sent", otp, userId: user.id });
  } catch (error) {
    console.error(error);
    return response(500, { error: "Could not process login" });
  }
};

// POST /verify-otp
module.exports.verifyOtp = async (event) => {
  const data = JSON.parse(event.body);
  const { phone, otp } = data;
  if (!phone || !otp) {
    return response(400, { error: "Phone and OTP are required" });
  }
  // Query for user by phone
  const params = {
    TableName: process.env.USERS_TABLE,
    IndexName: "phone-index",
    KeyConditionExpression: "phone = :phone",
    ExpressionAttributeValues: { ":phone": phone },
  };
  try {
    const result = await dynamoDb.query(params).promise();
    if (result.Items.length === 0) {
      return response(404, { error: "User not found" });
    }
    const user = result.Items[0];
    if (user.otp !== otp) {
      return response(400, { error: "Invalid OTP" });
    }
    // Remove OTP after verification
    const updateParams = {
      TableName: process.env.USERS_TABLE,
      Key: { id: user.id },
      UpdateExpression: "remove otp",
    };
    await dynamoDb.update(updateParams).promise();
    // Generate a JWT token
    const token = jwt.sign({ userId: user.id, phone: user.phone }, JWT_SECRET, {
      expiresIn: "1h",
    });
    return response(200, { token, user });
  } catch (error) {
    console.error(error);
    return response(500, { error: "OTP verification failed" });
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

  // Create the new poke record
  const poke = {
    id: uuidv4(),
    fromUserId: data.fromUserId,
    toUserId: data.toUserId,
    timestamp: new Date().toISOString(),
    status: "pending",
  };

  const pokeParams = {
    TableName: process.env.POKES_TABLE,
    Item: poke,
  };

  try {
    await dynamoDb.put(pokeParams).promise();

    // Check for reciprocal poke (a poke where the target already poked the sender)
    const reciprocalParams = {
      TableName: process.env.POKES_TABLE,
      FilterExpression:
        "fromUserId = :to and toUserId = :from and #status = :pending",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":to": data.toUserId,
        ":from": data.fromUserId,
        ":pending": "pending",
      },
    };
    const reciprocalResult = await dynamoDb.scan(reciprocalParams).promise();

    if (reciprocalResult.Items && reciprocalResult.Items.length > 0) {
      // Update both pokes to "accepted"
      const updatePoke = async (pokeItem) => {
        const updateParams = {
          TableName: process.env.POKES_TABLE,
          Key: { id: pokeItem.id },
          UpdateExpression: "set #status = :accepted",
          ExpressionAttributeNames: { "#status": "status" },
          ExpressionAttributeValues: { ":accepted": "accepted" },
        };
        await dynamoDb.update(updateParams).promise();
      };
      await updatePoke(poke);
      await updatePoke(reciprocalResult.Items[0]);

      // Create a conversation record. Assign the turn to the user who initiated the earlier poke.
      const conversation = {
        id: uuidv4(),
        user1Id: data.fromUserId,
        user2Id: data.toUserId,
        turn:
          reciprocalResult.Items[0].timestamp < poke.timestamp
            ? reciprocalResult.Items[0].fromUserId
            : data.fromUserId,
        createdAt: new Date().toISOString(),
      };
      const convParams = {
        TableName: process.env.CONVERSATIONS_TABLE,
        Item: conversation,
      };
      await dynamoDb.put(convParams).promise();

      return response(201, { poke, conversation });
    }

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

  // Retrieve the conversation record
  const convParams = {
    TableName: process.env.CONVERSATIONS_TABLE,
    Key: { id: data.conversationId },
  };

  try {
    const convResult = await dynamoDb.get(convParams).promise();
    const conversation = convResult.Item;
    if (!conversation) {
      return response(404, { error: "Conversation not found" });
    }

    // Ensure it is the sender's turn
    if (conversation.turn !== data.senderId) {
      return response(400, { error: "Not your turn to send a message" });
    }

    // Create the message record
    const message = {
      id: uuidv4(),
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: data.content,
      timestamp: new Date().toISOString(),
    };
    const messageParams = {
      TableName: process.env.MESSAGES_TABLE,
      Item: message,
    };
    await dynamoDb.put(messageParams).promise();

    // Update conversation turn to the other user
    const newTurn =
      conversation.user1Id === data.senderId
        ? conversation.user2Id
        : conversation.user1Id;
    const updateConvParams = {
      TableName: process.env.CONVERSATIONS_TABLE,
      Key: { id: data.conversationId },
      UpdateExpression: "set turn = :newTurn",
      ExpressionAttributeValues: { ":newTurn": newTurn },
      ReturnValues: "UPDATED_NEW",
    };
    await dynamoDb.update(updateConvParams).promise();

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
    IndexName: "conversationIndex", // Ensure a GSI exists on conversationId
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
