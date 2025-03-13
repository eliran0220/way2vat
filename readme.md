Things to imporve:

1. Make each service (most of them) a microservice, for example, io_socket, redis, could be a standalone service by themselves, AWS can stay injected.
2. Database aggregation functions - right now I'm saving in memory the summary, it would be way better to save and aggregate the data in mongodb, and in redis, for example
   the summary object. for large data, it won't be able to hold
3. Better database structure and indexing, right now only indexing the main index (\_id), and indexing the report on reportId, companyId.
4. Typescript project
5. Periodic save of batches could be optimized
6. used my aws access and private key in an env file, I can provide some screenshot examples if you'd like for the api calls...
7. I start the app by:
   docker-compose down  
   docker-compose up --build
