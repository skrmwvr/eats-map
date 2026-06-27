# ENUMS

This file defines the first-pass controlled vocabularies for the project. Enums are grouped by domain family, not kept as one flat list.

## lifecycle

### lifecycle_status
- `stub`
- `captured`
- `normalized`
- `draft`
- `stable`
- `stale`
- `superseded`
- `retracted`

## serving

### serving_path
- `hot`
- `warm`
- `cold`

### answer_mode
- `deterministic`
- `ai_augmentable`
- `retrieval_heavy`

### draft_status
- `draft`
- `stable`

## confidence

### confidence_bucket
- `unknown`
- `low`
- `medium`
- `high`

### contestation_bucket
- `unknown`
- `low`
- `medium`
- `high`

### presentation_risk
- `low`
- `medium`
- `high`

## composition

### composition_role
- `atomic`
- `composite`
- `master`

## revision

### update_mode
- `replace`
- `merge_patch`
- `json_patch`

### revision_reason
- `initial_create`
- `refresh`
- `correction`
- `enrichment`
- `normalization`
- `reclassification`
- `retraction`
- `assembly_change`

## source

### source_class
- `artist_official`
- `member_official`
- `venue_official`
- `festival_official`
- `label_official`
- `distributor_official`
- `publisher_official`
- `platform_official`
- `press`
- `review`
- `interview`
- `fan_community`
- `fan_report`
- `setlist_archive`
- `social_post`
- `ticketing`
- `weather_service`
- `map_service`
- `wiki`
- `generated`

## review

### review_gate
- `auto_okay`
- `human_review_required`
- `escalate_no_stable`

### actor_role
- `owner`
- `steward`
- `reviewer`
- `automation`

## feedback

### feedback_type
- `error_report`
- `correction`
- `dispute`
- `missing_info`
- `suggestion`

### reported_by_type
- `fan`
- `attendee`
- `artist_team`
- `venue_staff`
- `internal`

### feedback_status
- `new`
- `triaged`
- `in_review`
- `resolved`
- `rejected`

### severity
- `low`
- `medium`
- `high`

## reason_codes

### reason_code_family
- `source_strength`
- `source_conflict`
- `source_overlap`
- `freshness`
- `transformation`
- `completeness`
- `review`
- `claim_nature`

### reason_code
- `official_source`
- `independent_sources`
- `multiple_sources_agree`
- `single_source`
- `official_sources_conflict`
- `source_family_overlap`
- `stale_source`
- `fresh_source`
- `human_reviewed`
- `machine_extracted`
- `inferred`
- `critical_field_missing`
- `interpretive_claim`

## bundle_routing

### intent_family
- `find`
- `check`
- `show`
- `explain`
- `compare`
- `route`
- `save`
- `recap`
- `identify`
- `recommend`

### common_noun
- `parking`
- `restroom`
- `seat`
- `seat_section`
- `entry_gate`
- `lineup_location`
- `door_policy`
- `bag_policy`
- `water`
- `food`
- `merch`
- `accessibility_route`
- `pickup_dropoff`
- `help_point`
- `weather`
- `doors`
- `set_time`
- `opener`
- `bill_order`
- `queue_rules`
- `reentry_policy`
- `event_recap`
- `song`
- `album`
- `tour`
- `artist`
- `member`
- `discography`
- `lyrics_context`
- `crowd_note`
- `performance_note`
- `setlist`
- `era`
- `my_seat`
- `my_car`
- `my_entry`
- `my_route`
