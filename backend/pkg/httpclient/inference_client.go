package httpclient

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"langittoba/backend/internal/model"
)

type InferenceClient struct {
	BaseURL    string
	HTTPClient *http.Client
}

func NewInferenceClient(baseURL string) *InferenceClient {
	return &InferenceClient{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

type PredictRequest struct {
	Location string `json:"location"`
	Days     int    `json:"days"`
}

func (c *InferenceClient) Predict(location string, days int) (*model.ForecastResponse, error) {
	reqBody := PredictRequest{
		Location: location,
		Days:     days,
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	resp, err := c.HTTPClient.Post(
		c.BaseURL+"/predict",
		"application/json",
		bytes.NewBuffer(jsonBody),
	)
	if err != nil {
		return nil, fmt.Errorf("call inference API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("inference API error %d: %s", resp.StatusCode, string(body))
	}

	var result model.ForecastResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	return &result, nil
}

func (c *InferenceClient) HealthCheck() bool {
	resp, err := c.HTTPClient.Get(c.BaseURL + "/health")
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}