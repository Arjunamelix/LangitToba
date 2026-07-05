package scheduler

import (
	"log"
	"sync"
	"time"
)

// Job — satu pekerjaan terjadwal
type Job struct {
	Name     string
	Interval time.Duration
	Fn       func() error
}

// Scheduler — runner periodik sederhana (tanpa dependency eksternal)
type Scheduler struct {
	jobs   []Job
	stopCh chan struct{}
	wg     sync.WaitGroup
	mu     sync.Mutex
}

func New() *Scheduler {
	return &Scheduler{
		stopCh: make(chan struct{}),
	}
}

// Register — daftarkan job baru
func (s *Scheduler) Register(name string, interval time.Duration, fn func() error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.jobs = append(s.jobs, Job{Name: name, Interval: interval, Fn: fn})
}

// Start — jalankan semua job di goroutine masing-masing
// Panggil setelah semua Register() selesai.
func (s *Scheduler) Start() {
	s.mu.Lock()
	jobs := s.jobs
	s.mu.Unlock()

	for _, job := range jobs {
		j := job // capture
		s.wg.Add(1)
		go func() {
			defer s.wg.Done()
			log.Printf("[scheduler] Job '%s' dimulai, interval %s", j.Name, j.Interval)

			// Jalankan sekali langsung saat start
			if err := j.Fn(); err != nil {
				log.Printf("[scheduler] Job '%s' error (run awal): %v", j.Name, err)
			}

			ticker := time.NewTicker(j.Interval)
			defer ticker.Stop()

			for {
				select {
				case <-ticker.C:
					if err := j.Fn(); err != nil {
						log.Printf("[scheduler] Job '%s' error: %v", j.Name, err)
					} else {
						log.Printf("[scheduler] Job '%s' selesai", j.Name)
					}
				case <-s.stopCh:
					log.Printf("[scheduler] Job '%s' berhenti", j.Name)
					return
				}
			}
		}()
	}
}

// Stop — hentikan semua job secara graceful
func (s *Scheduler) Stop() {
	close(s.stopCh)
	s.wg.Wait()
	log.Println("[scheduler] Semua job berhenti")
}