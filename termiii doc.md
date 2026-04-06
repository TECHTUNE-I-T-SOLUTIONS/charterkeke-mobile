the base url "https://v3.api.termii.com"

the api key "TLAVibfUbePidfNsbHPATGNlpBJouvXiuEthLIJJGlHXuTEkQmFmRSVvEXMPNK"

the sender id "charterkeke"

their documentation:
"https://developers.termii.com/?_gl=1%2a1b410sr%2a_gcl_au%2aMTIwNTEyOTE4NC4xNzc1NDQ2MjUw#sdks"
"
Search Documentation

v1
Login
Sign Up
Home

Authentication
Error
Switch

Messaging

Token

Insights

Conversations

Sotel

Libraries

Join Loop

Introduction
These docs will give you a deep dive into our full API Reference Documentation and how to seamlessly integrate our messaging channels and verification functionalities into your product.

Basics
Our API is organised around using HTTP verbs and REST. Our API accepts and returns JSON formatted payload.

We provide sample code snippets and API calls that can serve as guide during your integration process.

We also advice running some tests using Postman. Postman is a collaboration platform for API development which makes testing endpoints easy. We have also provided a Postman Collection you can easily import to your postman and start testing.

SDKs
Ship your products faster & in any language you are proficient in by using SDKs provided by our community of open source developers. You can submit & view available ones here.

API Endpoint
In order to use Termii's APIs, you need to first create an account for free at termii.com.

BASE URL

Your Termii account has its own base URL, which you should use in all API requests.
Your base URL can be found on your dashboard.

The base URL is used to route your request to the appropriate "regulatory region" and to optimize traffic between data centers in the region.

Explore Products
Messaging
Deliver messages efficiently.

Token
Secure transactions for users.

Insights
Retrieve real-time reports

Errors
Error responses and codes

Events and Reports
Receive events on your webhook url

Updated at, Friday, April 3, 2026
 
Authentication
ON THIS PAGE

Basics
SDKs
API Endpoint
Explore Products
"


"https://developers.termii.com/messaging"
"
Search Documentation

v1
Login
Sign Up
Home

Authentication
Error
Switch

Messaging

Token

Insights

Conversations

Sotel

Libraries

Join Loop

Messaging
Termii’s Messaging APIs enable you to send messages globally across SMS, Voice, WhatsApp, and Email channels using a RESTful API. Each request is assigned a unique ID, allowing you to track the status of messages in real time—either by receiving Delivery Reports (DLRs) via your configured webhook endpoints or by polling the message status through a dedicated endpoint. The Messaging API is built on REST principles, using standard HTTPS methods and accepting JSON-formatted requests and responses.

Explore Messaging
Sender ID API
Request new Sender IDs and retrieve their status.

Messaging API
Send messages to customers across our messaging channels.

Number API
Send messages to customers using auto-generated messaging numbers.

WhatsApp Template API
Request and Send template messages across different messaging channels.

Campaign API
Send and manage campaigns sent to your phonebook.

Email
Deliver product notifications to customers via email.

Updated at, Friday, April 3, 2026
Error
Sender ID API
ON THIS PAGE

Explore Messaging
"

"
Search Documentation

v1
Login
Sign Up
Home

Authentication
Error
Switch

Messaging

Token

Insights

Conversations

Sotel

Libraries

Join Loop

Messaging API
This API enables businesses to send text messages to their customers across various messaging channels. It accepts JSON-formatted request payloads and returns JSON-encoded responses, using standard HTTP response codes to indicate success or failure.

Messaging Channels/Routes

Channel	Description
generic	Used to send promotional messages and messages to phone numbers not on DND (Do Not Disturb).
dnd	Delivers messages to all phone numbers, regardless of dnd restriction . Ideal for transactional or critical messages.
whatsapp	Sends messages via the WhatsApp messaging channel.
voice	Converts text messages into speech and delivers them as automated voice calls to recipients. Ideal for sending verification codes, alerts, or important notifications through a voice call.
Send message
The Messaging endpoint enables you to send a message to a single recipient via SMS, using either the Generic (Promotional) or DND (Transactional) route, depending on the type of message.

The generic (non-DND) route is meant strictly for promotional messages. It should not be used for sending OTP or transactional messages, as these are best handled via the DND (transactional) route.

The WhatsApp channel allows messages to be sent to a single recipient via WhatsApp, while the Voice channel converts text messages into speech and delivers them as a voice call to the recipient.

Using the generic route for OTPs may result in eventual delivery failures or Sender ID being blocked. Additionally, messages sent through the generic route will not deliver to numbers on Do-Not-Disturb (DND) and are subject to time restrictions in Nigeria for just MTN numbers (no message delivery between 8PM and 8AM WAT as enforced by the telecom provider, MTN). Please note that the time restriction does not apply to transactional messages sent on the DND route.

To ensure reliable delivery of OTPs or transactional messages, we strongly recommend using the DND route. To deliver messages to phone numbers on DND, the DND route needs to be activated on your account. Kindly reach out to our support team.
Endpoint : https://BASE_URL/api/sms/send

Request Type : POST

Body params

Options	Required	Description
api_key	yes	string
Your API key (It can be found on your Termii dashboard.
to	yes	string
Represents the destination phone number. Phone number must be in the international format (Example: 23490126727). You can also send to multiple numbers. To do so put numbers in an array (Example: ["23490555546", "23423490126999"]) Please note: the array takes only 100 phone numbers at a time
from	yes	string
Represents a sender ID for sms which can be Alphanumeric or Device name for Whatsapp. Alphanumeric sender ID length should be between 3 and 11 characters (Example:CompanyName)
sms	yes	string
This is the text message that will be delivered to the recipient's phone number.

Disclaimer (for Voice):
If the message contains a verification code, add spaces between the digits to ensure better interpretation for customers during text-to-speech conversion.
channel	yes	string
Specifies the route through which the message is sent. Accepted values are: dnd, generic, whatsapp, or voice.
dnd – for transactional or critical messages (bypasses DND restrictions).
generic – for promotional or non-transactional messages.
whatsapp – sends the message via the WhatsApp channel.
voice – converts the message to speech and delivers it via a voice call.
type	yes	string
Specifies the format of the message being sent. Supported types include:
plain - Standard text message unicode
Unicode-encoded message (for special characters or non-Latin scripts)
encrypted - Encrypted message (for added security)
Voice - Converts text to speech and delivers it as a voice call to the recipient.

Note: For encrypted messages you must provide the following details:
Algorithm (we strongly recommend AES)
Secret key


Note on special Characters: 1 page = 160 characters
Special characters reduces your message count from 160 characters per message to 70 characters per message.
Here are a few of them
; // ^ { }  \ [ ~ ] | € ' ”```



JSONJavaScriptNodeJsPythonC#JavaPHP
{
   "api_key": "Your API Key",  
   "to": "2347015250000",
   "from": "Great",
   "sms": "You are doing well John",
   "type": "plain",
   "channel": "generic"
  
}

Sample Response - 200 OK
   {
      "code": "ok",
      "balance": 1047.57,
      "message_id": "3017544054459083819856413",
      "message": "Successfully Sent",
      "user": "Oluwatobiloba Fatunde",
      "message_id_str": "3017544054459083819856413"
   }

Send WhatsApp Message (Conversational)
The Messaging endpoint allows you to send conversational messages to recipients via the WhatsApp channel.

Endpoint : https://BASE_URL/api/sms/send

Request Type : POST

Body params

Options	Required	Description
api_key	yes	string
Your API key (It can be found on your Termii dashboard.
to	yes	string
Represents the destination phone number. Phone number must be in the international format (Example: 23490126727). You can also send to multiple numbers. To do so put numbers in an array (Example: ["23490555546", "23423490126999"]) Please note: the array takes only 100 phone numbers at a time
from	yes	string
Represents a sender ID for sms which can be Alphanumeric or Device name for Whatsapp. Alphanumeric sender ID length should be between 3 and 11 characters (Example:CompanyName)
sms	yes	string
This is the text message that will be delivered to the recipient's phone number.
channel	yes	string
This should be passed as “whatsapp”.
type	yes	string
The kind of message that is sent, which is a plain message.
media	no	Object
This is a media object, it is only available for the High Volume WhatsApp. When using the media parameter, ensure you are not using the sms parameter
media.url	no	string
The url to the file resource.
media.caption	no	string
The caption that should be added to the image.
Media Types

File	Supported Format
Image	JPG, JPEG, PNG
Audio	MP3, OGG, AMR
Documents	PDF
Video	MP4 (Note: WhatsApp currently does not support MP4 files without an audio)


JSONJavaScriptNodeJsPythonC#JavaPHP
{
   "to": "2347880234567",
   "from": "talert",
   "sms": "Hi there, testing Termii",
   "type": "plain",
   "channel": "generic",
   "api_key": "Your API Key",
   "media": {
              "url": "https://media.example.com/file",
              "caption": "your media file"
           }    
}


Sample Response - 200 OK
   {
      "code": "ok",
      "balance": 1047.57,
      "message_id": "3017544054459083819856413",
      "message": "Successfully Sent",
      "user": "Oluwatobiloba Fatunde",
      "message_id_str": "3017544054459083819856413"
   }

Send Bulk message
The Messaging endpoints allows you to send bulk messages to recipients via SMS, using either the Generic (non-DND) or DND (Transactional) route, depending on the type of message.

Endpoint : https://BASE_URL/api/sms/send/bulk

Request Type : POST

Request Body Params:

Options	Required	Description
api_key	yes	string
Your API key (It can be found on your Termii dashboard.
to	yes	string
Represents the array of phone numbers you are sending to (Example: ["23490555546", "23423490126999","23490555546"]). Phone numbers must be in international format (Example: 23490126727). Please note: the array can take up to 100 phone numbers
from	yes	string
Represents a sender ID for sms which can be Alphanumeric or Device name for Whatsapp. Alphanumeric sender ID length should be between 3 and 11 characters (Example:CompanyName)
sms	yes	string
This is the text message that will be delivered to the recipient's phone number.
channel	yes	string
This is the route through which the message is sent. It is either dnd or generic .
type	yes	string
Specifies the format of the message being sent. Supported types include:
plain - Standard text message unicode
Unicode-encoded message (for special characters or non-Latin scripts)
encrypted - Encrypted message (for added security)

Note: For encrypted messages you must provide the following details:
Algorithm (we strongly recommend AES)
Secret key
Initialization Vector (IV) - required based on the selected encryption mode


JSONJavaScriptNodeJsPythonC#JavaPHP
{
     "to": ["23490555546", "23423490126999","23490555546"],
     "from": "talert",
     "sms": "Hi there, testing Termii",
     "type": "plain",
     "channel": "generic",
     "api_key": "Your API Key",
 }

Sample Response - 200 OK
   {
      "code": "ok",
      "balance": 1047.57,
      "message_id": "3017544054459083819856413",
      "message": "Successfully Sent",
      "user": "Oluwatobiloba Fatunde",
      "message_id_str": "3017544054459083819856413"
   }

Updated at, Friday, April 3, 2026
Sender ID API
Number API
ON THIS PAGE

Send message
Send WhatsApp Message (Conversational)
Send Bulk message
" ==> "https://developers.termii.com/messaging-api"


"https://developers.termii.com/error"
"
Search Documentation

v1
Login
Sign Up
Home

Authentication
Error
Switch

Messaging

Sender ID API
Messaging API
Templates API
Campaign API

Email API
Token

Insights

Conversations

Sotel

Libraries

Join Loop

Error
Termii uses HTTP response codes to indicate the success or failure of requests. In general:

Codes in the 2xx range indicate success.
Codes in the 4xx range indicate an error that failed given the information provided
Codes in the 5xx range indicate an error from Termii's end (these are rare).
HTTP status code summary
Code	Description
200	OK: Request was successful.
400	Bad Request: Indicates that the server cannot or will not process the request due to something that is perceived to be a client error
401	Unauthorized: No valid API key provided
403	Forbidden: The API key doesn't have permissions to perform the request.
404	Not Found: The requested resource doesn't exist.
405	Method Not allowed: The selected http method is not allowed
422	Unprocessable entity: indicates that the server understands the content type of the request entity, and the syntax of the request entity is correct, but it was unable to process the contained instructions
429	Too Many Requests: Indicates the user has sent too many requests in a given amount of time
5xx	Server Errors: Something went wrong on Termii's end
Common Errors
Unauthorized:
Getting Unauthorized and you are passing the right key? Check your API endpoint. This could also occur when you use http instead of https

Your account is not active:
Account has either been deactivated or disabled by the administrators. Kindly contact the administrator for more information to reactivate.

You are not set up on this route:
In this instance, that particular country route or intended destination is not set up for the user. Do contact your account manager to activate the route.

Your device has reached the daily limit:
The message volume activated on your device has reached the daily message limit.

Invalid Sender Id:
This prompt is received when the inputed sender ID is not registered or misspelt. Kindly confirm your sender ID on the dashboard or via API.

Device not found:
This occurs when your device is not registered or recognised by our system. Visit your dashboard to register your device.

Insufficient balance:
Wallet balance is not sufficient to perform that particular transaction. Kindly visit your dashboard to top-up your account or request an invoice.

No active subscription on your device:
Your device subscription has expired. Visit your dashboard to renew subscription.

Service temporarily unavailable:
In this rare instance, Termii is experiencing a downtime. Kindly contact the administrator.

This service is currently not active on your account:
The service in question is not active on your account. Kindly contact your account manager.

Device not active:
Rescan device barcode to the web server and ensure the device is connected to an active internet.

This WhatsApp 'destination' is not in a free-form window and no template matched with your content:
This happens when you are trying to send a free-form window message without your customer initiating the conversation or none of the registered approved templates matches the message content you are trying to send. In cases like this, your customer must have initiated the conversation by sending a WhatsApp message to your business registered WhatsApp number

Updated at, Friday, April 3, 2026
Authentication
Messaging
ON THIS PAGE

HTTP status code summary
Common Errors
"

and see from their postman collection "{
  "info": {
    "_postman_id": "d505ed35-e5d7-43de-a80f-430186c87620",
    "name": "Termii Public Api",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Switch",
      "item": [
        {
          "name": "SenderId",
          "protocolProfileBehavior": {
            "disableBodyPruning": true
          },
          "request": {
            "method": "GET",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"api_key\":\"TLMeX6iew1N6xlVsuTrNdWNBHghTCRDXvqkyvzis055bPFnzcNUs5utrkExZk5\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "https://api.ng.termii.com/api/sender-id?api_key=",
              "protocol": "https",
              "host": [
                "api",
                "ng",
                "termii",
                "com"
              ],
              "path": [
                "api",
                "sender-id"
              ],
              "query": [
                {
                  "key": "api_key",
                  "value": ""
                }
              ]
            }
          },
          "response": []
        },
        {
          "name": "Numbers ",
          "request": {
            "method": "POST",
            "header": [],
            "url": {
              "raw": "https://api.ng.termii.com/api/sms/number/send?to=&sms=Hi there, testing Termii&api_key=",
              "protocol": "https",
              "host": [
                "api",
                "ng",
                "termii",
                "com"
              ],
              "path": [
                "api",
                "sms",
                "number",
                "send"
              ],
              "query": [
                {
                  "key": "to",
                  "value": ""
                },
                {
                  "key": "sms",
                  "value": "Hi there, testing Termii"
                },
                {
                  "key": "api_key",
                  "value": ""
                }
              ]
            }
          },
          "response": []
        },
        {
          "name": "Send",
          "request": {
            "method": "POST",
            "header": [],
            "url": {
              "raw": "https://api.ng.termii.com/api/sms/send?to=&from=NCOTP&sms=Hi there, testing Termii&type=plain&channel=generic&api_key=",
              "protocol": "https",
              "host": [
                "api",
                "ng",
                "termii",
                "com"
              ],
              "path": [
                "api",
                "sms",
                "send"
              ],
              "query": [
                {
                  "key": "to",
                  "value": ""
                },
                {
                  "key": "from",
                  "value": "NCOTP"
                },
                {
                  "key": "sms",
                  "value": "Hi there, testing Termii"
                },
                {
                  "key": "type",
                  "value": "plain"
                },
                {
                  "key": "channel",
                  "value": "generic"
                },
                {
                  "key": "api_key",
                  "value": ""
                }
              ]
            }
          },
          "response": []
        }
      ]
    },
    {
      "name": "Token",
      "item": [
        {
          "name": "Send Token",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"api_key\":\"\",\n    \"message_type\": \"NUMERIC\",\n    \"to\": \"\",\n    \"from\":\"\",\n    \"channel\":\"dnd\",\n    \"pin_attempts\": \"10\",\n    \"pin_time_to_live\": \"5\",\n    \"pin_length\": \"6\",\n    \"pin_placeholder\":\"\u003C 1234 \u003E\",\n    \"message_text\": \"Your pin is \u003C 1234 \u003E\" ,\n    \"pin_type\":  \"NUMERIC\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "https://api.ng.termii.com/api/sms/otp/send",
              "protocol": "https",
              "host": [
                "api",
                "ng",
                "termii",
                "com"
              ],
              "path": [
                "api",
                "sms",
                "otp",
                "send"
              ]
            }
          },
          "response": []
        },
        {
          "name": "Verify Token",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"api_key\": \"\",\n    \"pin_id\" :\"c8dcd048-5e7f-4347-8c89-4470c3af0b\",\n    \"pin\" : \"12345\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "https://api.ng.termii.com/api/sms/otp/verify",
              "protocol": "https",
              "host": [
                "api",
                "ng",
                "termii",
                "com"
              ],
              "path": [
                "api",
                "sms",
                "otp",
                "verify"
              ]
            }
          },
          "response": []
        },
        {
          "name": "In-App Token",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n     \"api_key\": \"\",\n     \"pin_type\": \"NUMERIC\",\n     \"phone_number\": \"2348109477743\",\n     \"pin_attempts\": 3,\n     \"pin_time_to_live\": 0,\n     \"pin_length\": 4\n   }",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "https://api.ng.termii.com/api/sms/otp/generate",
              "protocol": "https",
              "host": [
                "api",
                "ng",
                "termii",
                "com"
              ],
              "path": [
                "api",
                "sms",
                "otp",
                "generate"
              ]
            }
          },
          "response": []
        }
      ]
    },
    {
      "name": "Insight",
      "item": [
        {
          "name": "history",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "http://api.ng.termii.com/api/sms/history/analytics?api_key=&message_id=&date_from=&date_to=&phone_number=234903546254",
              "protocol": "http",
              "host": [
                "api",
                "ng",
                "termii",
                "com"
              ],
              "path": [
                "api",
                "sms",
                "history",
                "analytics"
              ],
              "query": [
                {
                  "key": "api_key",
                  "value": ""
                },
                {
                  "key": "message_id",
                  "value": ""
                },
                {
                  "key": "date_from",
                  "value": ""
                },
                {
                  "key": "date_to",
                  "value": ""
                },
                {
                  "key": "phone_number",
                  "value": "234903546254"
                }
              ]
            }
          },
          "response": []
        },
        {
          "name": "Search",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "https://api.ng.termii.com/api/check/dnd?api_key=&phone_number=",
              "protocol": "https",
              "host": [
                "api",
                "ng",
                "termii",
                "com"
              ],
              "path": [
                "api",
                "check",
                "dnd"
              ],
              "query": [
                {
                  "key": "api_key",
                  "value": ""
                },
                {
                  "key": "phone_number",
                  "value": ""
                }
              ]
            }
          },
          "response": []
        },
        {
          "name": "Balance",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "https://api.ng.termii.com/api/get-balance?api_key=",
              "protocol": "https",
              "host": [
                "api",
                "ng",
                "termii",
                "com"
              ],
              "path": [
                "api",
                "get-balance"
              ],
              "query": [
                {
                  "key": "api_key",
                  "value": ""
                }
              ]
            }
          },
          "response": []
        },
        {
          "name": " Inbox API",
          "protocolProfileBehavior": {
            "disableBodyPruning": true
          },
          "request": {
            "method": "GET",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"\n}"
            },
            "url": {
              "raw": "https://api.ng.termii.com/api/sms/inbox?api_key=&date_from=&date_to=",
              "protocol": "https",
              "host": [
                "api",
                "ng",
                "termii",
                "com"
              ],
              "path": [
                "api",
                "sms",
                "inbox"
              ],
              "query": [
                {
                  "key": "api_key",
                  "value": ""
                },
                {
                  "key": "date_from",
                  "value": ""
                },
                {
                  "key": "date_to",
                  "value": ""
                }
              ]
            }
          },
          "response": []
        }
      ]
    }
  ]
}"