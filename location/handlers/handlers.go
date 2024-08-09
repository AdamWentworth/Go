package handlers

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"location/config"

	"github.com/Shopify/sarama"
)

func ConsumeMessages() {
	// Load Kafka configuration from app_conf.yml
	appConfig, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %s", err)
	}

	// Set up Sarama configuration
	saramaConfig := sarama.NewConfig()
	saramaConfig.Consumer.Return.Errors = true
	saramaConfig.Version = sarama.V2_1_0_0 // Use the appropriate Kafka version

	// Create a new Sarama consumer
	consumer, err := sarama.NewConsumer([]string{"localhost:" + appConfig.Events.Port}, saramaConfig)
	if err != nil {
		log.Fatalf("Failed to create Kafka consumer: %s", err)
	}
	defer consumer.Close()

	// Get partition consumer
	partitionConsumer, err := consumer.ConsumePartition(appConfig.Events.Topic, 0, sarama.OffsetOldest)
	if err != nil {
		log.Fatalf("Failed to consume partition: %s", err)
	}
	defer partitionConsumer.Close()

	log.Printf("Kafka consumer started and subscribed to topic: %s", appConfig.Events.Topic)

	// Handle system signals for graceful shutdown
	sigchan := make(chan os.Signal, 1)
	signal.Notify(sigchan, syscall.SIGINT, syscall.SIGTERM)

	run := true
	for run {
		select {
		case sig := <-sigchan:
			log.Printf("Caught signal %v: terminating\n", sig)
			run = false
		case msg := <-partitionConsumer.Messages():
			log.Printf("Message received on topic %s: %s", msg.Topic, string(msg.Value))
			// Example: Parse and log user_id from the message
			// You can add JSON unmarshalling here as needed
		case err := <-partitionConsumer.Errors():
			log.Printf("Consumer error: %v\n", err)
		}
	}

	log.Println("Kafka consumer closed")
}
