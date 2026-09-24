import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import DietPlanCard from './DietPlanCard';
import DietLoggerForm from './DietLoggerForm';
import DietCompareChart from './DietCompareChart';

export default function DietSection({ pet }) {
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState(false);
  const [logs, setLogs] = useState([]);

  const loadLogs = async () => {
    try {
      const list = await base44.entities.DietLog.filter({ pet_id: pet.id }, '-date', 60);
      setLogs(list);
    } catch (err) {
      console.error(err);
    }
  };

  const generatePlan = async () => {
    setPlanLoading(true);
    setPlanError(false);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a veterinary nutritionist. Create the most ideal daily diet intake plan for a pet with these details:
- Name: ${pet.name}
- Species: ${pet.species}
- Breed: ${pet.breed || 'mixed / unknown'}
- Age: ${pet.age || 'unknown'}
- Bio/notes: ${pet.bio || 'none'}

Base the plan on the typical weight range for this breed and species, an age-appropriate activity level, and standard veterinary nutrition guidelines. Return realistic, practical values: daily water in oz, ideal calories per day, recommended number of meals per day, cups of dry food per meal, and max treats in grams per day (keep treats under 100 Calories total). For symptoms, include the most relevant risks for this breed/species — always consider GDV (bloating) for large deep-chested dogs, dehydration, and allergies.`,
        response_json_schema: {
          type: 'object',
          properties: {
            water_oz: { type: 'number' },
            calories_per_day: { type: 'number' },
            meals_per_day: { type: 'number' },
            cups_per_meal: { type: 'number' },
            max_treats_grams: { type: 'number' },
            symptoms: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      setPlan(res);
    } catch (err) {
      console.error(err);
      setPlanError(true);
    } finally {
      setPlanLoading(false);
    }
  };

  useEffect(() => {
    generatePlan();
    loadLogs();
  }, [pet.id]);

  return (
    <div className="space-y-5">
      <DietPlanCard pet={pet} plan={plan} loading={planLoading} error={planError} onRefresh={generatePlan} />
      <DietLoggerForm pet={pet} onSaved={loadLogs} />
      <DietCompareChart pet={pet} plan={plan} logs={logs} />
    </div>
  );
}