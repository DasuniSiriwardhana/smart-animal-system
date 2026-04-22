"use client";

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

type ScheduleDetails = {
  meal_type: string;
  portion_size: number;
  portion_unit: string;
  food_type: string;
};

function ConfirmForm() {
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get('scheduleId');
  const petName = searchParams.get('petName') || 'your pet';
  
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [product, setProduct] = useState<string>('');
  const [actualPortion, setActualPortion] = useState<string>('');
  const [scheduleDetails, setScheduleDetails] = useState<ScheduleDetails | null>(null);

  useEffect(() => {
    if (scheduleId) {
      fetch(`/api/feeding/schedule-details?scheduleId=${scheduleId}`)
        .then(res => res.json())
        .then((data: { success: boolean; schedule: ScheduleDetails }) => {
          if (data.success) {
            setScheduleDetails(data.schedule);
          }
        })
        .catch(console.error);
    }
  }, [scheduleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!brand || !product || !actualPortion) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/feeding/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_id: scheduleId,
          food_brand: brand,
          food_product: product,
          actual_portion: parseFloat(actualPortion)
        })
      });
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        const data = await response.json() as { error: string };
        setError(data.error || 'Failed to confirm feeding');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!scheduleId) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'Arial' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h2>Invalid Link</h2>
          <p>This confirmation link is invalid or has been used.</p>
          <button onClick={() => window.location.href = '/'}>Go Home</button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'Arial' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h2 style={{ color: 'green' }}>Feeding Confirmed!</h2>
          <p>Thank you for logging {petName}&apos;s meal.</p>
          <p>Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f0e8', fontFamily: 'Arial' }}>
      <div style={{ maxWidth: '450px', width: '100%', margin: '20px', backgroundColor: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🐾</div>
          <h1 style={{ color: '#2f4454', margin: '0 0 5px 0' }}>Confirm Feeding</h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>Log the details for {petName}&apos;s meal</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px', padding: '10px', marginBottom: '20px', color: 'red' }}>
            {error}
          </div>
        )}

        {scheduleDetails && (
          <div style={{ backgroundColor: '#f8f6f2', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
            <p><strong>Meal Details:</strong></p>
            <p>{scheduleDetails.meal_type} • {scheduleDetails.portion_size} {scheduleDetails.portion_unit || 'grams'} • {scheduleDetails.food_type}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Food Brand *</label>
            <input
              type="text"
              placeholder="e.g., Whiskas, Pedigree"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Food Product *</label>
            <input
              type="text"
              placeholder="e.g., Tuna, Chicken"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Actual Portion Eaten *</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="number"
                step="10"
                placeholder="e.g., 150"
                value={actualPortion}
                onChange={(e) => setActualPortion(e.target.value)}
                required
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              />
              <span style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
                {scheduleDetails?.portion_unit || 'grams'}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Confirming...' : 'Confirm Feeding'}
          </button>

          <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', marginTop: '15px' }}>
            This will record the feeding and update your pet&apos;s feeding history.
          </p>
        </form>
      </div>
    </div>
  );
}

export default function FeedingConfirmPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>}>
      <ConfirmForm />
    </Suspense>
  );
}